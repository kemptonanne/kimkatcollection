import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Cherry, Heart } from "lucide-react";
import { useState } from "react";
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

function Checkout() {
  const items = useCart();
  const total = cartTotal(items);
  const place = useServerFn(submitOrder);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [method, setMethod] = useState<string>(PAYMENT_LINKS[0].name);
  const [placing, setPlacing] = useState(false);
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
                className="cozy-card tap-target flex items-center justify-between bg-blush px-5 py-4"
              >
                <span className="font-display font-semibold">{link.name}</span>
                <span className="text-sm text-inksoft">{link.handle}</span>
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
    setPlacing(true);
    try {
      const result = await place({
        data: {
          items: items.map((l) => ({
            id: l.id,
            title: l.title,
            price: l.price,
            quantity: l.quantity,
          })),
          total,
          buyerName: name,
          buyerContact: contact,
          paymentMethod: method,
        },
      });
      clearCart();
      setOrderId(result.id);
    } catch {
      toast.error("We couldn't place that order. Please try again.");
    } finally {
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
