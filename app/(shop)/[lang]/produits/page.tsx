import { Catalog } from "@/components/shop/catalog";
import { getCategories, getProducts } from "@/lib/data";
import { categoryName } from "@/lib/localize";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata({ locale, path: "/produits", title: t.products.title, description: t.meta.description });
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { locale, t } = await resolveLocale(params);
  const { cat } = await searchParams;
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const active = categories.find((c) => c.slug === cat) ?? null;

  return (
    <div className="container-page pb-4 pt-10 sm:pt-14">
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {active ? categoryName(active, locale) : t.products.title}
      </h1>
      <div className="mt-8">
        <Catalog products={products} categories={categories} locale={locale} t={t} activeCategory={active?.slug ?? null} />
      </div>
    </div>
  );
}
