import { Link } from "@tanstack/react-router";
import { Menu, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { cartCount, useCart } from "@/lib/cart";
import { SIGNUP_FORM_URL, TELEGRAM_URL } from "@/lib/format";

const NAV = [
  { to: "/view-bag", hash: "", label: "View my bag" },
  { to: "/", hash: "", label: "Shop" },
  { to: "/", hash: "help", label: "Help" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const count = cartCount(useCart());

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="customer-menu"
          onClick={() => setOpen((v) => !v)}
          className="tap-target -ml-2 flex items-center justify-center rounded-2xl text-ink transition-colors hover:bg-blush sm:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
        <Link
          to="/"
          className="flex shrink-0 flex-col items-center leading-none"
          onClick={() => setOpen(false)}
        >
          <span className="font-display text-lg font-semibold text-brand">KimKat</span>
          <span className="text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
            Collection
          </span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              hash={item.hash}
              className="tap-target inline-flex items-center rounded-xl px-3 text-sm font-bold text-ink hover:bg-blush"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          to="/cart"
          aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          onClick={() => setOpen(false)}
          className="tap-target -mr-2 relative flex items-center justify-center rounded-2xl text-ink transition-colors hover:bg-blush"
        >
          <ShoppingCart className="size-6" />
          {count > 0 && (
            <span className="absolute right-0 top-1 grid size-5 place-items-center rounded-full bg-brand text-[0.65rem] font-bold text-brand-foreground">
              {count}
            </span>
          )}
        </Link>
      </div>
      {open && (
        <nav
          id="customer-menu"
          aria-label="Mobile navigation"
          className="border-t border-border/70 bg-cream px-4 pb-4 pt-2 sm:hidden"
        >
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  hash={item.hash}
                  onClick={() => setOpen(false)}
                  className="tap-target flex items-center rounded-xl px-3 text-base font-semibold text-ink hover:bg-blush"
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
                className="tap-target flex items-center rounded-xl px-3 text-base font-semibold text-ink hover:bg-blush"
              >
                New customer signup
              </a>
            </li>
            <li>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram updates (opens in new tab)"
                onClick={() => setOpen(false)}
                className="tap-target flex items-center rounded-xl px-3 text-base font-semibold text-ink hover:bg-blush"
              >
                Telegram updates
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
