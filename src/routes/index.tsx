import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Cherry, Heart } from "lucide-react";
import { listProducts } from "@/lib/shop.functions";
import { money } from "@/lib/format";
import { PaymentLinks } from "@/components/site-footer";

const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kim Kat Collection — Jewelry & Collectibles Shop" },
      {
        name: "description",
        content:
          "Shop handpicked jewelry and collectibles from Kim Kat Collection, check your live-sale bag balance, and pay by Venmo, Cash App, or PayPal.",
      },
      { property: "og:title", content: "Kim Kat Collection — Jewelry & Collectibles" },
      {
        property: "og:description",
        content: "Handpicked jewelry and collectibles, plus live-sale bag balances you can check anytime.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  errorComponent: () => (
    <p className="px-4 py-16 text-center text-sm text-inksoft">
      The shop didn&apos;t load. Please refresh and try again.
    </p>
  ),
  component: Shop,
});

const tones = ["bg-blush", "bg-lilac", "bg-mint", "bg-sky", "bg-butter"];

function Shop() {
  const { data: products } = useSuspenseQuery(productsQuery);

  return (
    <div className="pb-4">
      <section className="px-4 pt-6">
        <div className="relative overflow-hidden rounded-4xl bg-blush px-6 py-8 text-center">
          <Heart className="absolute -left-2 top-6 size-10 rotate-[-14deg] text-brand/15" fill="currentColor" />
          <Cherry className="absolute -right-1 top-14 size-10 rotate-12 text-brand/15" />
          <Heart className="absolute bottom-4 right-10 size-6 rotate-6 text-brand/10" fill="currentColor" />
          <span className="inline-flex items-center gap-1 rounded-full bg-surface/70 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
            <Cherry className="size-3" /> New drops weekly
          </span>
          <h1 className="mt-4 font-display text-3xl leading-tight">
            Little treasures, picked with love
          </h1>
          <p className="mt-3 text-sm text-inksoft">
            Jewelry and collectibles from the live sales — grab them here between shows.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-brand/60">
            <Heart className="size-3" fill="currentColor" />
            <Cherry className="size-4" />
            <Heart className="size-3" fill="currentColor" />
          </div>
        </div>
      </section>

      <section className="mt-8 px-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Shop all</h2>
          <span className="text-sm text-inksoft">{products.length} items</span>
        </div>

        {products.length === 0 ? (
          <p className="mt-6 rounded-3xl bg-surface px-5 py-8 text-center text-sm text-inksoft">
            Nothing listed right now — check back after the next live.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {products.map((product, i) => (
              <li key={product.id}>
                <Link
                  to="/product/$id"
                  params={{ id: product.id }}
                  className="block overflow-hidden rounded-3xl bg-surface transition-transform active:scale-[0.98]"
                >
                  <div className={`aspect-square ${tones[i % tones.length]}`}>
                    {product.image_urls[0] ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.title}
                        loading="lazy"
                        width={512}
                        height={512}
                        className="size-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="px-3 py-3">
                    <p className="line-clamp-2 text-sm font-bold leading-snug">{product.title}</p>
                    <p className="mt-1 font-display text-base text-brand">{money(product.price)}</p>
                    {product.quantity <= 0 && (
                      <p className="mt-1 text-xs font-semibold text-inksoft">Sold out</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 px-4">
        <Link
          to="/check-my-bag"
          className="flex items-center justify-between rounded-4xl bg-sky px-6 py-6 transition-transform active:scale-[0.99]"
        >
          <span>
            <span className="block font-display text-xl">Check my bag</span>
            <span className="mt-1 block text-sm text-inksoft">
              See your items, balance and due date.
            </span>
          </span>
          <span className="text-2xl text-brand">→</span>
        </Link>
      </section>

      <div className="mt-10">
        <PaymentLinks />
      </div>
    </div>
  );
}
