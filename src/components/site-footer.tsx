import { ExternalLink } from "lucide-react";

import { PAYMENT_LINKS, SIGNUP_FORM_URL, TELEGRAM_URL } from "@/lib/format";

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
              aria-label={`Pay with ${link.name} (opens in new tab)`}
              className="cozy-card tap-target flex items-center justify-between bg-blush px-5 py-4 text-ink transition-transform active:scale-[0.99]"
            >
              <span className="font-display text-base font-semibold">{link.name}</span>
              <span className="flex items-center gap-1.5 text-sm text-inksoft">
                {link.handle}
                <ExternalLink className="size-4" aria-hidden="true" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative mt-12 border-t border-border/70 bg-blush px-4 py-8 text-center">
      <p className="font-display text-lg font-semibold text-brand">KimKat Collection</p>
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
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Join us on Telegram (opens in new tab)"
        className="cozy-card tap-target mt-3 inline-flex items-center justify-center gap-2 bg-surface px-6 text-sm font-semibold text-brand"
      >
        Join us on Telegram
        <ExternalLink className="size-4" aria-hidden="true" />
      </a>
    </footer>
  );
}
