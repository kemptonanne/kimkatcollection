import { Cherry, Heart } from "lucide-react";
import { PAYMENT_LINKS, SIGNUP_FORM_URL } from "@/lib/format";

const toneClass: Record<string, string> = {
  lilac: "bg-lilac",
  mint: "bg-mint",
  butter: "bg-butter",
};

export function PaymentLinks({ title = "Pay your balance" }: { title?: string }) {
  return (
    <section className="px-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <ul className="grid gap-3">
        {PAYMENT_LINKS.map((link) => (
          <li key={link.name}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className={`tap-target flex items-center justify-between rounded-3xl px-5 py-4 text-ink transition-transform active:scale-[0.99] ${toneClass[link.tone]}`}
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
    <footer className="mt-12 border-t border-border/70 bg-blush/50 px-4 py-8 text-center">
      <p className="flex items-center justify-center gap-1.5 font-display text-lg font-semibold text-brand">
        <Heart className="size-4" fill="currentColor" /> Kim Kat Collection <Cherry className="size-4" />
      </p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-inksoft">
        Jewelry &amp; collectibles, live on TikTok.
      </p>
      <a
        href={SIGNUP_FORM_URL}
        target="_blank"
        rel="noreferrer"
        className="tap-target mt-4 inline-flex items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-brand-foreground"
      >
        Join the customer list
      </a>
    </footer>
  );
}
