import { createFileRoute, Link } from "@tanstack/react-router";
import { Cherry, Heart, Trash2 } from "lucide-react";
import { cartTotal, removeFromCart, setQuantity, useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { BowIcon } from "@/components/bow-icon";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — KimKat Collection" },
      {
        name: "description",
        content:
          "Review the jewelry and collectibles in your KimKat Collection cart before checkout.",
      },
      { property: "og:title", content: "Your cart — KimKat Collection" },
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
      <p className="mt-2 text-sm text-inksoft">
        Claimed during a live? Your items are in{" "}
        <Link to="/view-bag" className="font-bold text-brand underline underline-offset-4">
          View my bag
        </Link>
        .
      </p>

      {items.length === 0 ? (
        <div className="cozy-card relative mt-5 overflow-hidden px-5 py-10 text-center">
          <div className="relative flex items-center justify-center gap-2 text-brand/60">
            <Cherry className="size-4" />
            <Heart className="size-4" fill="currentColor" />
            <BowIcon className="size-5" />
            <Heart className="size-4" fill="currentColor" />
            <Cherry className="size-4" />
          </div>
          <p className="relative mt-3 font-display text-lg">Your cart is empty</p>
          <p className="relative mt-1 text-sm text-inksoft">
            Items added from the online shop will appear here.
          </p>
          <Link
            to="/"
            className="cozy-btn relative tap-target mt-4 inline-flex items-center justify-center px-6 text-sm"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-5 grid gap-3">
            {items.map((line) => (
              <li key={line.id} className="cozy-card flex gap-3 p-3">
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
                    <div className="flex items-center rounded-full bg-lilac shadow-card">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${line.title}`}
                        onClick={() => setQuantity(line.id, line.quantity - 1)}
                        className="tap-target rounded-full px-2 font-bold"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-sm font-bold">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${line.title}`}
                        onClick={() => setQuantity(line.id, line.quantity + 1)}
                        className="tap-target rounded-full px-2 font-bold"
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

          <div className="cozy-card mt-6 flex items-center justify-between bg-blush px-5 py-4">
            <span className="text-sm font-bold">Total</span>
            <span className="font-display text-xl">{money(total)}</span>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-cream/95 px-4 py-3 backdrop-blur">
            <Link
              to="/checkout"
              className="cozy-btn tap-target flex w-full items-center justify-center py-4 text-base"
            >
              Checkout · {money(total)}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
