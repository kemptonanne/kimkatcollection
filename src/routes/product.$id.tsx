import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Cherry, Heart } from "lucide-react";
import { toast } from "sonner";
import { getProduct } from "@/lib/shop.functions";
import { money } from "@/lib/format";
import { addToCart } from "@/lib/cart";
import { BowIcon } from "@/components/bow-icon";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    const product = await getProduct({ data: { id: params.id } });
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Item unavailable — KimKat Collection" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const description =
      loaderData.description.slice(0, 150) || "A little treasure from KimKat Collection.";
    return {
      meta: [
        { title: `${loaderData.title} — KimKat Collection` },
        { name: "description", content: description },
        { property: "og:title", content: `${loaderData.title} — KimKat Collection` },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="px-4 py-16 text-center">
      <div className="cozy-card relative mx-auto max-w-sm overflow-hidden px-5 py-8">
        <Heart className="absolute -right-3 -top-3 size-20 text-brand/10" fill="currentColor" />
        <Cherry className="absolute -left-3 -bottom-3 size-20 text-brand/10" />
        <BowIcon className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 text-brand/5" />
        <p className="relative font-display text-xl">That item is gone</p>
        <Link to="/" className="relative mt-4 inline-block text-sm font-bold text-brand">
          Back to the shop
        </Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <p className="px-4 py-16 text-center text-sm text-inksoft">This item didn&apos;t load.</p>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const product = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const soldOut = product.quantity <= 0;

  return (
    <div className="pb-28">
      <div className="relative aspect-square bg-blush">
        <Heart className="absolute left-3 top-3 size-10 text-brand/15" fill="currentColor" />
        <Cherry className="absolute right-3 bottom-3 size-10 text-brand/15" />
        {product.image_urls[0] ? (
          <img
            src={product.image_urls[0]}
            alt={product.title}
            width={1024}
            height={1024}
            className="size-full object-cover"
          />
        ) : null}
      </div>

      {product.image_urls.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto px-4 pt-3">
          {product.image_urls.slice(1).map((url) => (
            <li key={url} className="shrink-0">
              <img
                src={url}
                alt=""
                loading="lazy"
                width={160}
                height={160}
                className="size-20 rounded-2xl object-cover shadow-card"
              />
            </li>
          ))}
        </ul>
      )}

      <div className="px-4 pt-5">
        <div className="flex items-center justify-center gap-2 text-brand/40">
          <Cherry className="size-4" />
          <Heart className="size-4" fill="currentColor" />
          <BowIcon className="size-5" />
          <Heart className="size-4" fill="currentColor" />
          <Cherry className="size-4" />
        </div>
        <h1 className="mt-3 font-display text-2xl leading-tight">{product.title}</h1>
        <p className="mt-2 font-display text-2xl text-brand">{money(product.price)}</p>
        <p className="mt-1 text-sm text-inksoft">
          {soldOut ? "Sold out" : `${product.quantity} available`}
        </p>
        <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-ink/80">
          {product.description}
        </p>

        <div className="cozy-card mt-6 inline-flex items-center gap-4 bg-surface px-4 py-3">
          <span className="text-sm font-bold">Quantity</span>
          <div className="flex items-center rounded-full bg-lilac shadow-card">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="tap-target rounded-full px-2 text-lg font-bold text-ink"
            >
              −
            </button>
            <span className="min-w-8 text-center text-base font-bold">{qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty((q) => Math.min(product.quantity || 1, q + 1))}
              className="tap-target rounded-full px-2 text-lg font-bold text-ink"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-cream/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            addToCart(
              {
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image_urls[0] ?? null,
              },
              qty,
            );
            toast.success("Added to your cart");
          }}
          className="cozy-btn tap-target flex w-full items-center justify-center py-4 text-base disabled:opacity-50"
        >
          {soldOut ? "Sold out" : `Add to cart · ${money(product.price * qty)}`}
        </button>
      </div>
    </div>
  );
}
