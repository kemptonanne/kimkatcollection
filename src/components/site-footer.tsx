import { Cherry, Heart } from "lucide-react";
import { BowIcon } from "@/components/bow-icon";
import { PAYMENT_LINKS, SIGNUP_FORM_URL } from "@/lib/format";

const toneClass: Record<string, string> = {
  lilac: "bg-lilac",
  mint: "bg-mint",
  butter: "bg-butter",
};

export function PaymentLinks({ title = "Pay your balance" }: { title?: string }) {
  return (
    <section className="px-4">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Cherry className="size-4 text-brand" /> {title} <BowIcon className="size-4 text-brand" />
      </h2>
      <ul className="grid gap-3">
        {PAYMENT_LINKS.map((link) => (
          <li key={link.name}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className={`cozy-card tap-target flex items-center justify-between px-5 py-4 text-ink transition-transform active:scale-[0.99] ${toneClass[link.tone]}`}
            >
              <span className="font-display text-base font-semibold">{link.name}</span>
              <span className="text-sm text-inksoft">{link.handle}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative mt-12 border-t border-border/70 bg-blush/60 px-4 py-8 text-center">
      <div className="absolute inset-x-0 top-0 flex -translate-y-1/2 items-center justify-center gap-2 text-brand/30">
        <Heart className="size-4" fill="currentColor" />
        <Cherry className="size-5" />
        <BowIcon className="size-5" />
        <Cherry className="size-5" />
        <Heart className="size-4" fill="currentColor" />
      </div>
      <p className="flex items-center justify-center gap-1.5 font-display text-lg font-semibold text-brand">
        <Cherry className="size-4" /> KimKat Collection <BowIcon className="size-4" />
      </p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-inksoft">
        Jewelry &amp; collectibles, live on TikTok.
      </p>
      <a
        href={SIGNUP_FORM_URL}
        target="_blank"
        rel="noreferrer"
        className="cozy-btn tap-target mt-4 inline-flex items-center justify-center px-6 text-sm"
      >
        Join the customer list
      </a>
    </footer>
  );
}
