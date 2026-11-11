import { CartView } from "@/components/shop/cart-view";
import { getProducts } from "@/lib/data";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata({ locale, path: "/panier", title: t.cart.title, description: t.meta.description, noindex: true });
}

export default async function CartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const products = await getProducts();
  return (
    <div className="container-page pb-4 pt-10 sm:pt-14">
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{t.cart.title}</h1>
      <div className="mt-8">
        <CartView products={products} locale={locale} t={t} />
      </div>
    </div>
  );
}
