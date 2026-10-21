import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { lookupBag } from "@/lib/bags.functions";
import { TIKTOK_URL, money, parseMoney } from "@/lib/format";
import { PaymentLinks } from "@/components/site-footer";

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

const LAST_BAG_KEY = "kkc:last-bag";
/** Matches the server-side lookup validation (z.string().max(60)). */
const BAG_QUERY_MAX = 60;

function readLastBag(): string {
  try {
    return window.localStorage.getItem(LAST_BAG_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveLastBag(value: string): void {
  try {
    window.localStorage.setItem(LAST_BAG_KEY, value);
  } catch {
    // Storage blocked (private mode, quota) — remembering the bag is optional.
  }
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function ViewMyBag() {
  const lookup = useServerFn(lookupBag);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Dialog a11y: focus in, trap Tab, Escape closes, lock scroll, restore focus.
  useEffect(() => {
    if (!sheetOpen) return;
    const panel = panelRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setSheetOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      const target = returnFocusRef.current;
      if (target && document.contains(target)) target.focus();
    };
  }, [sheetOpen]);

  // Remember the last bag number so repeat visitors don't retype it.
  useEffect(() => {
    const saved = readLastBag().slice(0, BAG_QUERY_MAX);
    if (saved) setQuery(saved);
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setLoading(true);
    setError(null);
    setResult(null);
    setSheetOpen(true);
    try {
      const data = await lookup({ data: { query: query.trim() } });
      setResult(data);
      saveLastBag(query.trim());
    } catch {
      setSheetOpen(false);
      setError("We couldn't reach the bag list right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  const bag = result?.found ? result.bag : null;
  const items = result?.found ? result.items : [];
  const remaining = parseMoney(bag?.balanceDue);
  const paidInFull =
    !!bag && bag.balanceDue.trim() !== "" && remaining <= 0 && parseMoney(bag.bagTotal) > 0;

  return (
    <div className="px-4 pb-12 pt-6">
      <div className="relative overflow-hidden rounded-3xl bg-blush px-5 py-5 text-center shadow-soft">
        <h1 className="relative font-display text-2xl">View my bag</h1>
        <p className="relative mt-2 text-sm text-inksoft">
          Enter your bag number to view your items, remaining balance, and payment due date.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-bold">Bag number</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputMode="numeric"
            maxLength={BAG_QUERY_MAX}
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
            The bag list isn&apos;t answering — try again in a moment, or{" "}
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Message Kim on TikTok (opens in new tab)"
              className="font-bold text-brand underline underline-offset-4"
            >
              message Kim on TikTok
            </a>{" "}
            if it keeps happening.
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

      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Bag details"
          onClick={() => setSheetOpen(false)}
        >
          <div
            ref={panelRef}
            tabIndex={-1}
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-cream px-4 pb-8 pt-3 shadow-soft outline-none sm:rounded-3xl sm:px-6"
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
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div className="col-span-2 rounded-2xl bg-lilac px-5 py-4">
                    <dt className="text-sm font-bold text-inksoft">Remaining balance</dt>
                    <dd className="mt-1 font-display text-3xl text-brand">{money(remaining)}</dd>
                    {paidInFull && (
                      <p className="mt-2 text-sm font-bold text-brand">Paid in full</p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-surface px-4 py-3">
                    <dt className="text-xs font-bold text-inksoft">Bag total</dt>
                    <dd className="mt-1 font-display text-base">
                      {money(parseMoney(bag.bagTotal))}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-surface px-4 py-3">
                    <dt className="text-xs font-bold text-inksoft">Payment due</dt>
                    <dd className="mt-1 font-display text-base">{bag.dueDate || "Not listed"}</dd>
                  </div>
                </dl>

                <p className="mt-3 inline-flex rounded-full bg-lilac px-4 py-1.5 text-sm font-bold shadow-card">
                  Status: {bag.status || "—"}
                </p>

                {remaining > 0 && (
                  <PaymentLinks
                    className="mt-5"
                    description="Choose an app to pay your remaining balance."
                  />
                )}
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
