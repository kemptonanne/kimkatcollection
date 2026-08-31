import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { cartTotal, removeFromCart, setQuantity, useCart } from "@/lib/cart";
import { money } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — Kim Kat Collection" },
      { name: "description", content: "Review the jewelry and collectibles in your Kim Kat Collection cart before checkout." },
      { property: "og:title", content: "Your cart — Kim Kat Collection" },
      { property: "og:description", content: "Review your items before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const items = useCart();
  const total = cartTotal(items);

  return (
    <div className="px-4 pb-28 pt-6">
      <h1 className="font-display text-2xl">Your cart</h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-surface px-5 py-10 text-center">
          <p className="text-sm text-inksoft">Your cart is empty.</p>
          <Link
            to="/"
            className="tap-target mt-4 inline-flex items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-brand-foreground"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-5 grid gap-3">
            {items.map((line) => (
              <li key={line.id} className="flex gap-3 rounded-3xl bg-surface p-3">
                <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-blush">
                  {line.image ? (
                    <img
                      src={line.image}
                      alt={line.title}
                      loading="lazy"
                      width={160}
                      height={160}
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold leading-snug">{line.title}</p>
                  <p className="mt-1 text-sm text-brand">{money(line.price)}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-full bg-lilac">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${line.title}`}
                        onClick={() => setQuantity(line.id, line.quantity - 1)}
                        className="tap-target rounded-full font-bold"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-sm font-bold">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${line.title}`}
                        onClick={() => setQuantity(line.id, line.quantity + 1)}
                        className="tap-target rounded-full font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${line.title}`}
                      onClick={() => removeFromCart(line.id)}
                      className="tap-target flex items-center justify-center rounded-full text-inksoft"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between rounded-3xl bg-butter px-5 py-4">
            <span className="text-sm font-bold">Total</span>
            <span className="font-display text-xl">{money(total)}</span>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-cream/95 px-4 py-3 backdrop-blur">
            <Link
              to="/checkout"
              className="tap-target flex w-full items-center justify-center rounded-full bg-brand py-4 text-base font-bold text-brand-foreground"
            >
              Checkout · {money(total)}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
