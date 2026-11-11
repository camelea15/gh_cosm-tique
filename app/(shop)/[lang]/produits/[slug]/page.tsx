import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { ProductCard } from "@/components/shop/product-card";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductPurchase } from "@/components/shop/product-detail";
import { getCategories, getProductBySlug, getProducts } from "@/lib/data";
import { formatDA } from "@/lib/format";
import { categoryName, productDescription, productName } from "@/lib/localize";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: t.notFound.title, robots: { index: false } };
  const name = productName(p, locale);
  const desc = productDescription(p, locale) ?? `${name} - ${formatDA(p.price_retail, locale)} - ${t.meta.description}`;
  return pageMetadata({ locale, path: `/produits/${p.slug}`, title: name, description: desc.slice(0, 200), image: p.image_url });
}

export default async function ProductPage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { slug } = await params;
  const [product, categories, all] = await Promise.all([getProductBySlug(slug), getCategories(), getProducts()]);
  if (!product) notFound();

  const name = productName(product, locale);
  const description = productDescription(product, locale);
  const cat = categories.find((c) => c.slug === product.category_slug);
  const related = all.filter((p) => p.id !== product.id && p.category_slug === product.category_slug).slice(0, 4);
  const out = product.stock === 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name_fr,
    image: product.image_url ? [product.image_url.startsWith("http") ? product.image_url : `${siteUrl()}${product.image_url}`] : undefined,
    description: product.description_fr ?? undefined,
    offers: {
      "@type": "Offer",
      url: `${siteUrl()}/${locale}/produits/${product.slug}`,
      priceCurrency: "DZD",
      price: product.price_retail,
      availability: out ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="container-page pb-4 pt-8 sm:pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
        <Link href={`/${locale}/produits`} className="inline-flex items-center gap-1.5 hover:text-brand-700">
          <Icon name="arrow" size={14} className="rotate-180 rtl:rotate-0" />
          {t.products.back}
        </Link>
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-2 lg:gap-14">
        <ProductGallery
          images={[product.image_url, ...(product.extra_images ?? [])].filter((x): x is string => !!x)}
          alt={name}
          sizes="(min-width: 768px) 50vw, 100vw"
        />

        <div className="flex flex-col">
          {cat && (
            <Link href={`/${locale}/produits?cat=${cat.slug}`} className="eyebrow hover:text-brand-800">
              {categoryName(cat, locale)}
            </Link>
          )}
          <h1 className="font-display mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{name}</h1>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <p className="text-3xl font-bold text-brand-700">{formatDA(product.price_retail, locale)}</p>
            <p className="text-sm text-muted">
              {t.products.wholesale} :{" "}
              <span className="font-semibold text-ink">{formatDA(product.price_wholesale, locale)}</span>
            </p>
          </div>

          {description && <p className="mt-6 leading-relaxed text-ink/80">{description}</p>}

          <div className="mt-8 border-t border-line pt-8">
            <ProductPurchase
              productId={product.id}
              priceRetail={product.price_retail}
              priceWholesale={product.price_wholesale}
              outOfStock={out}
              locale={locale}
              t={t}
            />
          </div>

          <ul className="mt-8 space-y-3 rounded-2xl bg-brand-50/70 p-5 text-sm text-ink/80">
            <li className="flex items-center gap-3">
              <Icon name="cash" size={18} className="text-brand-600" />
              {t.home.trust[0].title}
            </li>
            <li className="flex items-center gap-3">
              <Icon name="truck" size={18} className="text-brand-600" />
              {t.home.trust[1].title}
            </li>
            <li className="flex items-center gap-3">
              <Icon name="phone" size={18} className="text-brand-600" />
              {t.home.trust[3].title}
            </li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{t.products.related}</h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} locale={locale} t={t} categoryLabel={cat ? categoryName(cat, locale) : undefined} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
