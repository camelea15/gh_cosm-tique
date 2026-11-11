import Link from "next/link";
import { ProductImage } from "@/components/shop/product-image";
import { QuickAdd } from "@/components/shop/quick-add";
import { formatDA } from "@/lib/format";
import { productName } from "@/lib/localize";
import type { Product } from "@/lib/data";
import type { Dict, Locale } from "@/lib/i18n";

export function ProductCard({
  product,
  locale,
  t,
  categoryLabel,
  priority,
}: {
  product: Product;
  locale: Locale;
  t: Dict;
  categoryLabel?: string;
  priority?: boolean;
}) {
  const name = productName(product, locale);
  const out = product.stock === 0;
  const hasWholesaleDiscount = product.price_wholesale < product.price_retail;
  return (
    <article className="group card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link href={`/${locale}/produits/${product.slug}`} className="block" aria-label={name}>
        <div className="relative aspect-[4/5] overflow-hidden bg-brand-50">
          <div className="absolute inset-0 transition duration-500 group-hover:scale-105">
            <ProductImage
              src={product.image_url}
              alt={name}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={priority}
            />
          </div>
          {out && (
            <span className="absolute start-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-medium text-white">
              {t.products.outOfStock}
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          {categoryLabel && <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">{categoryLabel}</p>}
          <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
            <Link href={`/${locale}/produits/${product.slug}`}>{name}</Link>
          </h3>
        </div>
        <div>
          <p className="text-lg font-bold text-brand-700">{formatDA(product.price_retail, locale)}</p>
          <p className="mt-0.5 text-xs text-muted">
            {t.products.wholesaleShort} :{" "}
            <span className={hasWholesaleDiscount ? "font-semibold text-ink" : ""}>
              {formatDA(product.price_wholesale, locale)}
            </span>
          </p>
        </div>
        <QuickAdd productId={product.id} label={t.products.add} addedLabel={t.products.added} disabled={out} />
      </div>
    </article>
  );
}
