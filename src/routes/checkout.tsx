import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Cherry, Heart, ExternalLink } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cartTotal, clearCart, useCart } from "@/lib/cart";
import { money, PAYMENT_LINKS } from "@/lib/format";
import { submitOrder } from "@/lib/shop.functions";
import { BowIcon } from "@/components/bow-icon";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — KimKat Collection" },
      {
        name: "description",
        content: "Place your KimKat Collection order and pay by Venmo, Cash App, or PayPal.",
      },
      { property: "og:title", content: "Checkout — KimKat Collection" },
      {
        property: "og:description",
        content: "Place your order and pay by Venmo, Cash App, or PayPal.",
      },
    ],
  }),
  component: Checkout,
});

const RETRY_STORAGE_KEY = "kkc:checkout-retry";

type CheckoutRetry = { fingerprint: string; key: string };

function readCheckoutRetry(): CheckoutRetry | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(RETRY_STORAGE_KEY) ?? "null");
    if (typeof saved?.fingerprint === "string" && typeof saved?.key === "string") return saved;
  } catch {
    // Storage may be disabled. Keep retries available while the page is open.
  }
  return null;
}

function storeCheckoutRetry(retry: CheckoutRetry | null) {
  try {
    if (retry) sessionStorage.setItem(RETRY_STORAGE_KEY, JSON.stringify(retry));
    else sessionStorage.removeItem(RETRY_STORAGE_KEY);
  } catch {
    // The current page still has the retry key in memory.
  }
}

function Checkout() {
  const items = useCart();
  const total = cartTotal(items);
  const place = useServerFn(submitOrder);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [method, setMethod] = useState<string>(PAYMENT_LINKS[0].name);
  const [placing, setPlacing] = useState(false);
  const submitting = useRef(false);
  const retry = useRef<CheckoutRetry | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  if (orderId) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="cozy-card relative mx-auto max-w-sm overflow-hidden bg-blush px-6 py-10">
          <Heart className="absolute -right-4 -top-4 size-24 text-brand/10" fill="currentColor" />
          <Cherry className="absolute -left-4 -bottom-4 size-24 text-brand/10" />
          <BowIcon className="absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 text-brand/5" />
          <h1 className="relative font-display text-2xl">Order received</h1>
          <p className="relative mt-3 text-sm text-inksoft">
            Send your payment with the button below and Kim will confirm your order.
          </p>
          <p className="relative mt-3 text-xs text-inksoft">
            Reference: {orderId.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <ul className="mx-auto mt-6 grid max-w-sm gap-3">
          {PAYMENT_LINKS.map((link) => (
            <li key={link.name}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Pay with ${link.name} (opens in new tab)`}
                className="cozy-card tap-target flex items-center justify-between bg-blush px-5 py-4"
              >
                <span className="font-display font-semibold">{link.name}</span>
                <span className="flex items-center gap-1.5 text-sm text-inksoft">
                  {link.handle}
                  <ExternalLink className="size-4" aria-hidden="true" />
                </span>
              </a>
            </li>
          ))}
        </ul>
        <Link
          to="/"
          className="tap-target mt-6 inline-flex items-center text-sm font-bold text-brand"
        >
          Back to the shop
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="cozy-card relative mx-auto max-w-sm overflow-hidden px-5 py-8">
          <Heart className="absolute -right-3 -top-3 size-20 text-brand/10" fill="currentColor" />
          <Cherry className="absolute -left-3 -bottom-3 size-20 text-brand/10" />
          <BowIcon className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 text-brand/5" />
          <p className="relative text-sm text-inksoft">There&apos;s nothing to check out yet.</p>
          <Link
            to="/"
            className="cozy-btn relative tap-target mt-4 inline-flex items-center px-6 text-sm"
          >
            Start shopping
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setPlacing(true);
    try {
      const orderItems = items.map(({ id, title, price, quantity }) => ({
        id,
        title,
        price,
        quantity,
      }));
      const details = JSON.stringify([
        orderItems.map(({ id, price, quantity }) => [id, price, quantity]),
        name.trim(),
        contact.trim(),
        method,
      ]);
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(details));
      const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      const previous = retry.current ?? readCheckoutRetry();
      const checkoutKey =
        previous?.fingerprint === fingerprint ? previous.key : crypto.randomUUID();
      retry.current = { fingerprint, key: checkoutKey };
      storeCheckoutRetry(retry.current);

      const result = await place({
        data: {
          checkoutKey,
          items: orderItems,
          total,
          buyerName: name,
          buyerContact: contact,
          paymentMethod: method,
        },
      });
      clearCart();
      retry.current = null;
      storeCheckoutRetry(null);
      setOrderId(result.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "We couldn't place that order. Please try again.",
      );
    } finally {
      submitting.current = false;
      setPlacing(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="px-4 pb-10 pt-6">
      <h1 className="font-display text-2xl">Checkout</h1>
      <p className="mt-2 text-sm text-inksoft">
        Payment is sent manually after you place the order. No card details are collected here.
      </p>

      <ul className="cozy-card mt-5 grid gap-2 p-4">
        {items.map((line) => (
          <li key={line.id} className="flex justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              {line.quantity} × {line.title}
            </span>
            <span className="shrink-0 font-bold">{money(line.price * line.quantity)}</span>
          </li>
        ))}
        <li className="mt-2 flex justify-between border-t border-border pt-3 font-display text-lg">
          <span>Total</span>
          <span>{money(total)}</span>
        </li>
      </ul>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-sm font-bold">Your name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="tap-target rounded-2xl border border-input bg-surface px-4 text-base shadow-card"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-bold">TikTok handle or email</span>
          <input
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="tap-target rounded-2xl border border-input bg-surface px-4 text-base shadow-card"
          />
        </label>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-bold">How will you pay?</legend>
          {PAYMENT_LINKS.map((link) => (
            <label
              key={link.name}
              className="cozy-card tap-target flex items-center gap-3 bg-blush px-5 py-3"
            >
              <input
                type="radio"
                name="method"
                value={link.name}
                checked={method === link.name}
                onChange={() => setMethod(link.name)}
                className="size-5 accent-[var(--brand)]"
              />
              <span className="font-semibold">{link.name}</span>
              <span className="ml-auto text-sm text-inksoft">{link.handle}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <button
        type="submit"
        disabled={placing}
        className="cozy-btn tap-target mt-8 flex w-full items-center justify-center py-4 text-base disabled:opacity-60"
      >
        {placing ? "Placing order…" : `Place order · ${money(total)}`}
      </button>
    </form>
  );
}
