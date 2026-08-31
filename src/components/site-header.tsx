import { Link } from "@tanstack/react-router";
import { Heart, Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { cartCount, useCart } from "@/lib/cart";
import { SIGNUP_FORM_URL } from "@/lib/format";

const NAV = [
  { to: "/", label: "Shop" },
  { to: "/check-my-bag", label: "View Bag" },
  { to: "/cart", label: "Cart" },
  { to: "/admin", label: "Admin" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const count = cartCount(useCart());

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="tap-target -ml-2 flex items-center justify-center rounded-2xl text-ink transition-colors hover:bg-blush"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>


        <Link to="/" className="flex flex-col items-center leading-none" onClick={() => setOpen(false)}>
          <span className="flex items-center gap-1 font-display text-lg font-semibold text-brand">
            <Heart className="size-4" fill="currentColor" /> Kim Kat
          </span>
          <span className="text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
            Collection
          </span>
        </Link>

        <Link
          to="/cart"
          aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          className="tap-target -mr-2 relative flex items-center justify-center rounded-2xl text-ink transition-colors hover:bg-blush"
        >
          <ShoppingBag className="size-6" />
          {count > 0 && (
            <span className="absolute right-0 top-1 grid size-5 place-items-center rounded-full bg-brand text-[0.65rem] font-bold text-brand-foreground">
              {count}
            </span>
          )}
        </Link>
      </div>

      {open && (
        <nav className="border-t border-border/70 bg-cream px-4 pb-4 pt-2">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  activeProps={{ className: "text-brand" }}
                  className="tap-target flex items-center rounded-2xl px-3 text-base font-semibold text-ink transition-colors hover:bg-blush"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={SIGNUP_FORM_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="tap-target flex items-center rounded-2xl px-3 text-base font-semibold text-ink transition-colors hover:bg-blush"
              >
                New Customer Sign-Up
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
