import { Link } from "@tanstack/react-router";
import { TIKTOK_URL } from "@/lib/format";

function ContactKim() {
  return (
    <a
      href={TIKTOK_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Message Kim on TikTok (opens in new tab)"
      className="font-bold text-brand underline underline-offset-4"
    >
      Message Kim on TikTok
    </a>
  );
}

export function CustomerHelp() {
  return (
    <section id="help" aria-labelledby="help-title" className="mt-8 scroll-mt-24 px-4">
      <h2 id="help-title" className="font-display text-xl">
        How it works
      </h2>
      <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface px-4">
        <details className="py-1">
          <summary className="tap-target cursor-pointer py-3 text-sm font-bold">
            How do I find my bag?
          </summary>
          <p className="pb-4 text-sm leading-relaxed text-inksoft">
            Enter your assigned bag number in{" "}
            <Link to="/view-bag" className="font-bold text-brand underline underline-offset-4">
              View my bag
            </Link>
            . If you don&apos;t know your number, <ContactKim />.
          </p>
        </details>
        <details className="py-1">
          <summary className="tap-target cursor-pointer py-3 text-sm font-bold">
            How do I pay for live-sale items?
          </summary>
          <p className="pb-4 text-sm leading-relaxed text-inksoft">
            Look up your bag, check your remaining balance, then choose Venmo, Cash App, or PayPal.
            You&apos;ll send payment in your chosen app.
          </p>
        </details>
        <details className="py-1">
          <summary className="tap-target cursor-pointer py-3 text-sm font-bold">
            Is my live-sale bag the same as my cart?
          </summary>
          <p className="pb-4 text-sm leading-relaxed text-inksoft">
            Live-sale claims appear in your bag. The cart holds items you add from the online shop.
          </p>
        </details>
        <details className="py-1">
          <summary className="tap-target cursor-pointer py-3 text-sm font-bold">
            What about shipping costs and delivery times?
          </summary>
          <p className="pb-4 text-sm leading-relaxed text-inksoft">
            For shipping costs and delivery estimates for your order, <ContactKim /> before paying.
          </p>
        </details>
        <details className="py-1">
          <summary className="tap-target cursor-pointer py-3 text-sm font-bold">
            Can I return or exchange an item?
          </summary>
          <p className="pb-4 text-sm leading-relaxed text-inksoft">
            Before purchasing, <ContactKim /> to ask about return or exchange options for the item
            you&apos;re considering.
          </p>
        </details>
      </div>
    </section>
  );
}
