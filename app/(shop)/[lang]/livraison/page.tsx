import { Icon } from "@/components/icons";
import { DeliveryTable } from "@/components/shop/delivery-table";
import { getWilayas } from "@/lib/data";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata({ locale, path: "/livraison", title: t.delivery.title, description: t.delivery.intro });
}

export default async function DeliveryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const wilayas = await getWilayas();
  const cards = [
    { icon: "pin" as const, title: t.delivery.stopdeskTitle, text: t.delivery.stopdeskText },
    { icon: "truck" as const, title: t.delivery.homeTitle, text: t.delivery.homeText },
    { icon: "cash" as const, title: t.delivery.payTitle, text: t.delivery.payText },
  ];
  return (
    <div className="container-page pb-4 pt-10 sm:pt-14">
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{t.delivery.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{t.delivery.intro}</p>
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {cards.map((c) => (
          <li key={c.title} className="card p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Icon name={c.icon} size={22} />
            </span>
            <h2 className="mt-4 font-semibold">{c.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.text}</p>
          </li>
        ))}
      </ul>
      <div className="mt-12">
        <DeliveryTable wilayas={wilayas} locale={locale} t={t} />
      </div>
    </div>
  );
}
