import { ExternalLink } from "lucide-react";

import { PAYMENT_LINKS, SIGNUP_FORM_URL, TELEGRAM_URL, TIKTOK_URL } from "@/lib/format";

export function PaymentLinks({
  title = "Pay your balance",
  className = "px-4",
  description = "Check your remaining balance before sending payment.",
}: {
  title?: string;
  className?: string;
  description?: string;
}) {
  return (
    <section className={className}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mb-3 mt-1 text-sm text-inksoft">{description}</p>
      <ul className="grid gap-3">
        {PAYMENT_LINKS.map((link) => (
          <li key={link.name}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Pay with ${link.name} (opens in new tab)`}
              className="cozy-card tap-target flex items-center justify-between bg-blush px-4 py-3 text-ink transition-transform active:scale-[0.99]"
            >
              <span className="font-display text-base font-semibold">{link.name}</span>
              <span className="flex min-w-0 items-center gap-1.5 break-all text-sm text-inksoft">
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
    <footer className="relative mt-12 border-t border-border/70 bg-blush px-4 py-7 text-center">
      <p className="font-display text-lg font-semibold text-brand">KimKat Collection</p>
      <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={SIGNUP_FORM_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="New customer signup (opens in new tab)"
          className="cozy-btn tap-target inline-flex items-center justify-center px-6 text-sm"
        >
          New customer signup
        </a>
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Telegram live-sale updates (opens in new tab)"
          className="cozy-card tap-target inline-flex items-center justify-center bg-surface px-6 text-sm font-semibold text-brand"
        >
          Telegram updates
        </a>
      </div>
      <p className="mt-4 text-sm text-inksoft">
        Questions?{" "}
        <a
          href={TIKTOK_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Message Kim on TikTok (opens in new tab)"
          className="tap-target inline-flex items-center font-bold text-brand underline underline-offset-4"
        >
          Message Kim on TikTok
        </a>
      </p>
    </footer>
  );
}
