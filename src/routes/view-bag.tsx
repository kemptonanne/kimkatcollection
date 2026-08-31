import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Cherry, Heart, X } from "lucide-react";
import { lookupBag } from "@/lib/bags.functions";
import { money, parseMoney } from "@/lib/format";
import { PaymentLinks } from "@/components/site-footer";

export const Route = createFileRoute("/check-my-bag")({
  head: () => ({
    meta: [
      { title: "Check my bag — Kim Kat Collection" },
      {
        name: "description",
        content:
          "Look up your Kim Kat Collection live-sale bag by bag number to see items, balance and due date.",
      },
      { property: "og:title", content: "Check my bag — Kim Kat Collection" },
      {
        property: "og:description",
        content: "See your live-sale bag items, balance and due date in seconds.",
      },
    ],
  }),
  component: CheckMyBag,
});

type Result = Awaited<ReturnType<typeof lookupBag>>;

function CheckMyBag() {
  const lookup = useServerFn(lookupBag);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await lookup({ data: { query: query.trim() } });
      setResult(data);
      setSheetOpen(true);
    } catch {
      setError("We couldn't reach the bag list right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  const bag = result?.found ? result.bag : null;
  const items = result?.found ? result.items : [];

  return (
    <div className="bg-pattern px-4 pb-12 pt-6">
      <h1 className="font-display text-2xl">View my bag</h1>
      <p className="mt-2 text-sm text-inksoft">
        Enter your bag number to see what&apos;s inside, what you&apos;ve paid, and when it&apos;s
        due.
      </p>
      <div className="mt-3 flex items-center gap-2 text-brand/40">
        <Heart className="size-4" fill="currentColor" />
        <Cherry className="size-5" />
        <Heart className="size-4" fill="currentColor" />
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-bold">Bag number</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 1"
            className="tap-target rounded-2xl border border-input bg-surface px-4 text-base"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="tap-target flex items-center justify-center rounded-full bg-brand py-4 text-base font-bold text-brand-foreground disabled:opacity-60"
        >
          {loading ? "Looking…" : "Find my bag"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm font-semibold text-destructive">{error}</p>}

      <div className="mt-10">
        <PaymentLinks title="Pay on your bag" />
      </div>

      {sheetOpen && result && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-ink/40"
          role="dialog"
          aria-modal="true"
          aria-label="Bag details"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-4xl bg-cream px-4 pb-8 pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl">
                {bag ? `Bag #${bag.bagNumber}` : "No bag found"}
              </h2>
              <button
                type="button"
                aria-label="Close bag details"
                onClick={() => setSheetOpen(false)}
                className="tap-target -mr-2 -mt-2 flex items-center justify-center rounded-full text-inksoft"
              >
                <X className="size-6" />
              </button>
            </div>

            {!bag ? (
              <p className="mt-3 text-sm text-inksoft">
                We couldn&apos;t find bag “{query}”. Double-check the number, or message Kim on
                TikTok.
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-inksoft">
                  {bag.customerName} · {bag.tiktokHandle}
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-3xl bg-blush px-4 py-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-inksoft">Total</dt>
                    <dd className="font-display text-lg">{money(parseMoney(bag.bagTotal))}</dd>
                  </div>
                  <div className="rounded-3xl bg-mint px-4 py-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-inksoft">Paid</dt>
                    <dd className="font-display text-lg">{money(parseMoney(bag.paymentsReceived))}</dd>
                  </div>
                  <div className="rounded-3xl bg-butter px-4 py-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-inksoft">
                      Remaining
                    </dt>
                    <dd className="font-display text-lg">{money(parseMoney(bag.remainingBalance))}</dd>
                  </div>
                  <div className="rounded-3xl bg-sky px-4 py-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-inksoft">Due</dt>
                    <dd className="font-display text-lg">{bag.dueDate || "—"}</dd>
                  </div>
                </dl>

                <p className="mt-3 inline-flex rounded-full bg-lilac px-4 py-1.5 text-sm font-bold">
                  Status: {bag.status || "—"}
                </p>

                <h3 className="mt-6 text-base font-semibold">Items ({items.length})</h3>
                <ul className="mt-2 grid gap-2">
                  {items.map((item) => (
                    <li
                      key={item.rowNumber}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold">{item.description}</span>
                        {item.dateAdded && (
                          <span className="text-xs text-inksoft">{item.dateAdded}</span>
                        )}
                      </span>
                      <span className="shrink-0 font-bold">{money(parseMoney(item.price))}</span>
                    </li>
                  ))}
                  {items.length === 0 && (
                    <li className="rounded-2xl bg-surface px-4 py-3 text-sm text-inksoft">
                      No items added yet.
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
