import { redirect } from "next/navigation";
import { ConfirmationView } from "@/components/shop/confirmation-view";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata({ locale, path: "/confirmation", title: t.confirmation.title, description: t.meta.description, noindex: true });
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ n?: string }>;
}) {
  const { locale, t } = await resolveLocale(params);
  const { n } = await searchParams;
  // Cette page n'affiche que le numéro de commande : aucune donnée personnelle n'est consultable publiquement.
  if (!n || !/^GH-[A-Z0-9]{6}$/.test(n)) redirect(`/${locale}`);
  return (
    <div className="container-page py-14 sm:py-20">
      <ConfirmationView orderNumber={n} locale={locale} t={t} />
    </div>
  );
}
