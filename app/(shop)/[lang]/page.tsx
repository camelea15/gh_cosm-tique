import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProductCard } from "@/components/shop/product-card";
import { getCategories, getProducts } from "@/lib/data";
import { categoryName } from "@/lib/localize";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { SITE, siteUrl, whatsappLink } from "@/lib/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata({ locale, path: "", title: t.meta.title, description: t.meta.description });
}

const trustIcons = ["cash", "truck", "tag", "phone"] as const;

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const featured = products.slice(0, 8);
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));
  const countByCat = new Map<string, number>();
  for (const p of products) if (p.category_slug) countByCat.set(p.category_slug, (countByCat.get(p.category_slug) ?? 0) + 1);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: SITE.name,
    url: `${siteUrl()}/${locale}`,
    logo: `${siteUrl()}/logo.png`,
    image: `${siteUrl()}/og.png`,
    telephone: `+${SITE.whatsappIntl}`,
    address: { "@type": "PostalAddress", addressLocality: "Oran", addressCountry: "DZ" },
    sameAs: [SITE.instagram, SITE.tiktok, SITE.facebook],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="pointer-events-none absolute -top-24 end-[-8rem] h-96 w-96 rounded-full bg-brand-200/50 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 start-[-6rem] h-72 w-72 rounded-full bg-brand-100 blur-3xl" aria-hidden="true" />
        <div className="container-page relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <div>
            <p className="eyebrow">{t.home.eyebrow}</p>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-[1.12] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {t.home.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{t.home.subtitle}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={`/${locale}/produits`} className="btn btn-primary min-h-12 px-8 text-base">
                {t.home.cta}
                <Icon name="arrow" size={18} className="rtl:-scale-x-100" />
              </Link>
              <Link href={`/${locale}/livraison`} className="btn btn-outline min-h-12 px-8 text-base">
                {t.home.ctaSecondary}
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="relative mx-auto aspect-square w-full max-w-[22rem] rounded-full bg-white p-3 shadow-lift ring-1 ring-brand-100">
              <Image src="/logo.png" alt="GH Cosmétique" width={512} height={512} priority className="h-full w-full rounded-full" />
            </div>
            <span className="absolute -top-2 start-2 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-soft ring-1 ring-brand-100 sm:start-6">
              <Icon name="sparkle" size={14} /> Dermo-cosmétique
            </span>
            <span className="absolute -bottom-2 end-2 inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft sm:end-6">
              <Icon name="truck" size={14} /> 58 wilayas
            </span>
          </div>
        </div>
      </section>

      {/* Atouts */}
      <section aria-label="Atouts" className="border-y border-line bg-white">
        <ul className="container-page grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {t.home.trust.map((item, i) => (
            <li key={item.title} className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Icon name={trustIcons[i]} size={22} />
              </span>
              <div>
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Catégories */}
      <section className="container-page mt-20">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t.home.categoriesTitle}</h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/${locale}/produits?cat=${c.slug}`}
                className="group card flex h-full flex-col justify-between gap-6 bg-gradient-to-br from-white to-brand-50 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon name="sparkle" size={20} />
                </span>
                <span>
                  <span className="block font-semibold leading-snug text-ink">{categoryName(c, locale)}</span>
                  <span className="mt-1 block text-xs text-muted">{countByCat.get(c.slug) ?? 0}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Produits */}
      <section className="container-page mt-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t.home.featuredTitle}</h2>
          <Link href={`/${locale}/produits`} className="hidden text-sm font-semibold text-brand-700 hover:text-brand-800 sm:inline-flex sm:items-center sm:gap-1.5">
            {t.home.viewAll}
            <Icon name="arrow" size={16} className="rtl:-scale-x-100" />
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {featured.map((p, i) => {
            const cat = p.category_slug ? catBySlug.get(p.category_slug) : undefined;
            return (
              <li key={p.id}>
                <ProductCard product={p} locale={locale} t={t} categoryLabel={cat ? categoryName(cat, locale) : undefined} priority={i < 4} />
              </li>
            );
          })}
        </ul>
        <div className="mt-10 text-center">
          <Link href={`/${locale}/produits`} className="btn btn-outline min-h-12 px-8">
            {t.home.viewAll}
          </Link>
        </div>
      </section>

      {/* Comment commander */}
      <section className="container-page mt-24">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t.home.howTitle}</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {t.home.steps.map((s, i) => (
            <li key={s.title} className="card relative p-7">
              <span className="font-display text-5xl font-semibold text-brand-200">{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Contact */}
      <section className="container-page mt-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-14 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute -top-20 end-[-4rem] h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <h2 className="font-display relative text-3xl font-semibold sm:text-4xl">{t.home.contactTitle}</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-brand-100">{t.home.contactText}</p>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn relative mt-8 min-h-12 bg-white px-8 text-base text-brand-700 hover:bg-brand-50"
          >
            <Icon name="whatsapp" size={20} />
            {t.home.contactCta}
          </a>
        </div>
      </section>
    </>
  );
}
