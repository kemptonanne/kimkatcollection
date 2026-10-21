import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import {
  adminListOrders,
  adminLogin,
  adminLogout,
  adminStatus,
  adminUpdateOrderStatus,
} from "@/lib/admin.functions";
import { endAdminSession } from "@/lib/admin-session";
import { ProductManager } from "@/components/admin/product-manager";
import { money } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shop admin — KimKat Collection" },
      {
        name: "description",
        content: "Password-protected management for KimKat Collection products and orders.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Shop admin — KimKat Collection" },
      { property: "og:description", content: "Password-protected shop management." },
    ],
  }),
  component: AdminPage,
});

type Tab = "products" | "orders";

function AdminPage() {
  const queryClient = useQueryClient();
  const status = useServerFn(adminStatus);
  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);

  const session = useQuery({ queryKey: ["admin", "status"], queryFn: () => status() });
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [locking, setLocking] = useState(false);
  const [tab, setTab] = useState<Tab>("products");

  if (session.isLoading) {
    return <p className="px-4 py-16 text-center text-sm text-inksoft">Loading…</p>;
  }

  if (!session.data?.unlocked) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const result = await login({ data: { password } });
            if (result.ok) {
              setPassword("");
              await queryClient.invalidateQueries({ queryKey: ["admin"] });
              const fresh = await session.refetch();
              if (!fresh.data?.unlocked) {
                toast.error("Couldn't keep you signed in. Try opening the preview in a new tab.");
              }
            } else {
              toast.error("Incorrect password");
            }
          } catch {
            toast.error("Sign-in is unavailable. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
        className="px-4 py-16"
      >
        <div className="cozy-card relative mx-auto max-w-sm overflow-hidden px-6 py-10 text-center">
          <Lock className="relative mx-auto size-10 text-brand" />
          <h1 className="relative mt-4 font-display text-2xl">Shop admin</h1>
          <p className="relative mt-2 text-sm text-inksoft">
            Enter the admin password to manage the shop.
          </p>
          <input
            type="password"
            aria-label="Admin password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="tap-target relative mt-5 w-full rounded-2xl border border-input bg-surface px-4 text-base shadow-card"
          />
          <button
            type="submit"
            disabled={busy}
            className="cozy-btn tap-target relative mt-4 flex w-full items-center justify-center py-4 text-base disabled:opacity-60"
          >
            {busy ? "Checking…" : "Unlock"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="px-4 pb-16 pt-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl">Shop admin</h1>
        <button
          type="button"
          disabled={locking}
          onClick={async () => {
            setLocking(true);
            try {
              await endAdminSession(queryClient, () => logout());
            } catch {
              toast.error("Could not lock the shop. Please try again.");
            } finally {
              setLocking(false);
            }
          }}
          className="tap-target inline-flex items-center gap-1.5 rounded-full bg-blush px-4 py-2 text-sm font-bold shadow-card"
        >
          {locking ? "Locking…" : "Lock"}
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {(["products", "orders"] as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`tap-target shrink-0 rounded-full px-5 text-sm font-bold capitalize ${
              tab === value ? "cozy-btn" : "bg-lilac text-ink shadow-card"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "products" && <ProductManager />}
        {tab === "orders" && <OrderManager />}
      </div>
    </div>
  );
}

function OrderManager() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListOrders);
  const update = useServerFn(adminUpdateOrderStatus);
  const orders = useQuery({ queryKey: ["admin", "orders"], queryFn: () => list() });

  if (orders.isLoading) return <p className="text-sm text-inksoft">Loading orders…</p>;
  if (orders.isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        Orders could not be loaded. Please refresh and try again.
      </p>
    );
  if (!orders.data?.length) return <p className="text-sm text-inksoft">No orders yet.</p>;

  return (
    <ul className="grid gap-2">
      {orders.data.map((order) => (
        <li key={order.id} className="cozy-card bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold">{order.buyer_name || "Unnamed buyer"}</p>
              <p className="truncate text-xs text-inksoft">{order.buyer_contact}</p>
              <p className="mt-1 text-xs text-inksoft">
                {new Date(order.created_at as string).toLocaleString()} · {order.payment_method}
              </p>
            </div>
            <span className="shrink-0 font-display text-lg">{money(Number(order.total))}</span>
          </div>

          <ul className="mt-2 text-sm text-ink/80">
            {(order.items as { title: string; quantity: number }[]).map((item, i) => (
              <li key={i}>
                {item.quantity} × {item.title}
              </li>
            ))}
          </ul>

          <select
            value={order.status as string}
            onChange={async (e) => {
              await update({ data: { id: order.id as string, status: e.target.value } });
              toast.success("Order updated");
              queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
            }}
            className="tap-target mt-3 w-full rounded-2xl border border-input bg-cream px-4 text-sm shadow-card"
          >
            {["pending payment confirmation", "paid", "shipped", "cancelled"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </li>
      ))}
    </ul>
  );
}
