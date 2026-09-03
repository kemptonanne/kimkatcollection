import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Cherry, Heart } from "lucide-react";
import { listProducts } from "@/lib/shop.functions";
import { money } from "@/lib/format";
import { PaymentLinks } from "@/components/site-footer";
import { BowIcon } from "@/components/bow-icon";

const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KimKat Collection — Jewelry & Collectibles Shop" },
      {
        name: "description",
        content:
          "Shop handpicked jewelry and collectibles from KimKat Collection, check your live-sale bag balance, and pay by Venmo, Cash App, or PayPal.",
      },
      { property: "og:title", content: "KimKat Collection — Jewelry & Collectibles" },
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

const tones = ["bg-blush", "bg-lilac"];

function Shop() {
  const { data: products } = useSuspenseQuery(productsQuery);

  return (
    <div className="pb-4">
      <section className="px-4 pt-6">
        <div className="relative overflow-hidden rounded-4xl bg-blush px-6 py-10 text-center shadow-soft">
          <Heart className="absolute -left-3 top-4 size-16 rotate-[-14deg] text-brand/20" fill="currentColor" />
          <Cherry className="absolute -right-2 top-10 size-16 rotate-12 text-brand/20" />
          <BowIcon className="absolute bottom-2 right-16 size-10 rotate-6 text-brand/15" />
          <Heart className="absolute bottom-6 left-8 size-10 -rotate-12 text-brand/15" fill="currentColor" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand shadow-card">
            New drops weekly
          </span>
          <h1 className="mt-5 font-display text-3xl leading-tight">
            Little treasures, picked with <span className="text-brand">love</span>
          </h1>
          <p className="mt-3 text-sm text-inksoft">
            Jewelry and collectibles from the live sales — grab them here between shows.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2 text-brand/70">
            <Cherry className="size-4" />
            <Heart className="size-4" fill="currentColor" />
            <BowIcon className="size-5" />
            <Heart className="size-4" fill="currentColor" />
            <Cherry className="size-4" />
          </div>
        </div>
      </section>

      <section className="mt-8 px-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Shop all</h2>
          <span className="text-sm text-inksoft">{products.length} items</span>
        </div>

        {products.length === 0 ? (
          <div className="cozy-card mt-6 px-5 py-8 text-center text-sm text-inksoft">
            <div className="mb-3 flex items-center justify-center gap-2 text-brand/30">
              <Cherry className="size-6" />
              <Heart className="size-6" fill="currentColor" />
              <BowIcon className="size-7" />
              <Heart className="size-6" fill="currentColor" />
              <Cherry className="size-6" />
            </div>
            Nothing listed right now — check back soon.
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {products.map((product, i) => (
              <li key={product.id}>
                <Link
                  to="/product/$id"
                  params={{ id: product.id }}
                  className="cozy-card block overflow-hidden transition-transform active:scale-[0.98]"
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
          to="/view-bag"
          className="relative flex items-center justify-between overflow-hidden rounded-4xl bg-lilac px-6 py-6 shadow-soft transition-transform active:scale-[0.99]"
        >
          <Heart className="absolute -right-2 top-2 size-16 text-brand/10" fill="currentColor" />
          <BowIcon className="absolute -left-3 -bottom-3 size-16 text-brand/10" />
          <span className="relative">
            <span className="block font-display text-xl">View my bag</span>
            <span className="mt-1 block text-sm text-inksoft">
              See your items, balance, and due date.
            </span>
          </span>
          <span className="relative text-2xl text-brand">→</span>
        </Link>
      </section>

      <div className="mt-10">
        <PaymentLinks />
      </div>
    </div>
  );
}
