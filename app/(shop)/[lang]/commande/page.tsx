import { CheckoutForm } from "@/components/shop/checkout-form";
import { getProducts, getWilayas } from "@/lib/data";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata({ locale, path: "/commande", title: t.checkout.title, description: t.meta.description, noindex: true });
}

export default async function CheckoutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const [products, wilayas] = await Promise.all([getProducts(), getWilayas()]);
  return (
    <div className="container-page pb-4 pt-10 sm:pt-14">
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{t.checkout.title}</h1>
      <div className="mt-8">
        <CheckoutForm products={products} wilayas={wilayas} locale={locale} t={t} />
      </div>
    </div>
  );
}
