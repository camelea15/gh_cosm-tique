"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Icon } from "@/components/icons";
import { PriceTypeToggle } from "@/components/shop/price-type-toggle";
import { ProductImage } from "@/components/shop/product-image";
import { useCart } from "@/components/shop/cart-provider";
import { formatDA } from "@/lib/format";
import { productName } from "@/lib/localize";
import type { Product } from "@/lib/data";
import type { Dict, Locale } from "@/lib/i18n";

export function CartView({ products, locale, t }: { products: Product[]; locale: Locale; t: Dict }) {
  const { lines, ready, setQty, setPriceType, remove } = useCart();
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Retire du panier les produits qui n'existent plus ou ne sont plus en vente.
  useEffect(() => {
    if (!ready) return;
    for (const l of lines) if (!byId.has(l.id)) remove(l.id);
  }, [ready, lines, byId, remove]);

  const items = lines
    .map((l) => ({ line: l, product: byId.get(l.id) }))
    .filter((x): x is { line: (typeof lines)[number]; product: Product } => Boolean(x.product));

  const subtotal = items.reduce(
    (s, { line, product }) => s + (line.priceType === "gros" ? product.price_wholesale : product.price_retail) * line.qty,
    0,
  );

  if (!ready) {
    return <div className="h-48 animate-pulse rounded-2xl bg-brand-50" aria-hidden="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon name="cart" size={28} />
        </span>
        <p className="mt-5 text-lg font-medium text-ink">{t.cart.empty}</p>
        <Link href={`/${locale}/produits`} className="btn btn-primary mt-6">
          {t.cart.emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <ul className="space-y-4">
        {items.map(({ line, product }) => {
          const unit = line.priceType === "gros" ? product.price_wholesale : product.price_retail;
          const name = productName(product, locale);
          return (
            <li key={product.id} className="card flex gap-4 p-4">
              <Link
                href={`/${locale}/produits/${product.slug}`}
                className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl bg-brand-50 sm:w-24"
              >
                <ProductImage src={product.image_url} alt={name} sizes="96px" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/${locale}/produits/${product.slug}`} className="font-semibold leading-snug text-ink hover:text-brand-700">
                    {name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(product.id)}
                    className="-me-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-brand-50 hover:text-brand-700"
                    aria-label={`${t.cart.remove} : ${name}`}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </div>

                <PriceTypeToggle
                  compact
                  value={line.priceType}
                  onChange={(v) => setPriceType(product.id, v)}
                  options={[
                    { value: "detail", label: t.products.priceTypeDetail },
                    { value: "gros", label: t.products.priceTypeGros },
                  ]}
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full border border-line bg-white">
                    <button
                      type="button"
                      onClick={() => setQty(product.id, line.qty - 1)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-700 hover:bg-brand-50"
                      aria-label={t.cart.decrease}
                    >
                      <Icon name="minus" size={16} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{line.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(product.id, line.qty + 1)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-700 hover:bg-brand-50"
                      aria-label={t.cart.increase}
                    >
                      <Icon name="plus" size={16} />
                    </button>
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-muted">
                      {formatDA(unit, locale)} × {line.qty}
                    </p>
                    <p className="text-base font-bold text-brand-700">{formatDA(unit * line.qty, locale)}</p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="card p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-xl font-semibold">{t.checkout.summary}</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted">{t.cart.subtotal}</dt>
            <dd className="text-lg font-bold text-ink">{formatDA(subtotal, locale)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted">{t.cart.deliveryNote}</p>
        <Link href={`/${locale}/commande`} className="btn btn-primary mt-6 min-h-12 w-full text-base">
          {t.cart.checkout}
          <Icon name="arrow" size={18} className="rtl:-scale-x-100" />
        </Link>
        <Link href={`/${locale}/produits`} className="btn btn-ghost mt-2 w-full">
          {t.cart.continue}
        </Link>
      </aside>
    </div>
  );
}
