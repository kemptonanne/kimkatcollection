import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Cherry, Heart, X } from "lucide-react";
import { lookupBag } from "@/lib/bags.functions";
import { money, parseMoney } from "@/lib/format";
import { PaymentLinks } from "@/components/site-footer";
import { BowIcon } from "@/components/bow-icon";

export const Route = createFileRoute("/view-bag")({
  head: () => ({
    meta: [
      { title: "View my bag — KimKat Collection" },
      {
        name: "description",
        content:
          "Look up your KimKat Collection live-sale bag by bag number to see items, balance, and due date.",
      },
      { property: "og:title", content: "View my bag — KimKat Collection" },
      {
        property: "og:description",
        content: "See your live-sale bag items, balance, and due date in seconds.",
      },
    ],
  }),
  component: ViewMyBag,
});

type Result = Awaited<ReturnType<typeof lookupBag>>;

function ViewMyBag() {
  const lookup = useServerFn(lookupBag);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Remember the last bag number so repeat visitors don't retype it.
  useEffect(() => {
    const saved = window.localStorage.getItem("kkc:last-bag");
    if (saved) setQuery(saved);
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSheetOpen(true);
    try {
      const data = await lookup({ data: { query: query.trim() } });
      setResult(data);
      window.localStorage.setItem("kkc:last-bag", query.trim());
    } catch {
      setSheetOpen(false);
      setError("We couldn't reach the bag list right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  const bag = result?.found ? result.bag : null;
  const items = result?.found ? result.items : [];

  return (
    <div className="px-4 pb-12 pt-6">
      <div className="relative overflow-hidden rounded-4xl bg-blush px-6 py-6 text-center shadow-soft">
        <h1 className="relative font-display text-2xl">View my bag</h1>
        <p className="relative mt-2 text-sm text-inksoft">
          Enter your bag number to see what&apos;s inside, what you&apos;ve paid, and when it&apos;s
          due.
        </p>
        <div className="relative mt-3 flex items-center justify-center gap-2 text-brand/60">
          <Cherry className="size-4" />
          <Heart className="size-4" fill="currentColor" />
          <BowIcon className="size-5" />
          <Heart className="size-4" fill="currentColor" />
          <Cherry className="size-4" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-bold">Bag number</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 1"
            className="tap-target rounded-2xl border border-input bg-surface px-4 text-base shadow-card"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="cozy-btn tap-target flex items-center justify-center py-4 text-base disabled:opacity-60"
        >
          {loading ? "Looking…" : "Find my bag"}
        </button>
      </form>

      {error && (
        <div className="cozy-card mt-4 px-5 py-5 text-center" role="alert">
          <p className="font-display text-lg">Hmm, we couldn&apos;t check right now</p>
          <p className="mt-1 text-sm text-inksoft">
            The bag list isn&apos;t answering — try again in a moment, or message Kim on TikTok if
            it keeps happening.
          </p>
          <button
            type="button"
            onClick={onSubmit}
            className="cozy-btn tap-target mt-4 inline-flex items-center justify-center px-6 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      <div className="mt-10">
        <PaymentLinks title="Pay on your bag" />
      </div>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-ink/40"
          role="dialog"
          aria-modal="true"
          aria-label="Bag details"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-4xl bg-cream px-4 pb-8 pt-3 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl">
                {loading ? "Finding your bag…" : bag ? `Bag #${bag.bagNumber}` : "No bag found"}
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

            {loading ? (
              <div className="mt-4 grid gap-3" aria-live="polite">
                <div className="h-4 w-40 animate-pulse rounded-full bg-blush" />
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-3xl bg-blush" />
                  ))}
                </div>
                <div className="h-12 animate-pulse rounded-2xl bg-surface" />
                <div className="h-12 animate-pulse rounded-2xl bg-surface" />
              </div>
            ) : !bag ? (
              <p className="mt-3 text-sm text-inksoft">
                We couldn&apos;t find bag “{query}”. Double-check the number, or message Kim on
                TikTok.
              </p>
            ) : (
              <>
                <dl className="mt-4 grid grid-cols-2 gap-2">
                  <div className="cozy-card bg-blush px-4 py-2">
                    <dt className="text-xs font-bold uppercase tracking-wide text-inksoft">
                      Total
                    </dt>
                    <dd className="font-display text-lg">{money(parseMoney(bag.bagTotal))}</dd>
                  </div>
                  <div className="cozy-card bg-lilac px-4 py-2">
                    <dt className="text-xs font-bold uppercase tracking-wide text-inksoft">
                      Remaining
                    </dt>
                    <dd className="font-display text-lg">{money(parseMoney(bag.balanceDue))}</dd>
                  </div>
                  <div className="cozy-card bg-blush px-4 py-2">
                    <dt className="text-xs font-bold uppercase tracking-wide text-inksoft">Due</dt>
                    <dd className="font-display text-lg">{bag.dueDate || "—"}</dd>
                  </div>
                </dl>

                <p className="mt-3 inline-flex rounded-full bg-lilac px-4 py-1.5 text-sm font-bold shadow-card">
                  Status: {bag.status || "—"}
                </p>

                <h3 className="mt-6 text-base font-semibold">Items ({items.length})</h3>
                <ul className="mt-2 grid gap-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="cozy-card flex items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold">
                          {item.item}
                          {item.qty && item.qty !== "1" && (
                            <span className="font-normal text-inksoft"> ×{item.qty}</span>
                          )}
                        </span>
                        {item.dateClaimed && (
                          <span className="text-xs text-inksoft">{item.dateClaimed}</span>
                        )}
                      </span>
                      <span className="shrink-0 font-bold">{money(parseMoney(item.total))}</span>
                    </li>
                  ))}
                  {items.length === 0 && (
                    <li className="cozy-card px-4 py-3 text-sm text-inksoft">
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
