import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

export function pageMetadata(opts: {
  locale: Locale;
  path: string; // ex. "/produits" (vide pour l'accueil)
  title: string;
  description: string;
  image?: string | null;
  noindex?: boolean;
}): Metadata {
  const base = siteUrl();
  const url = (l: Locale) => `${base}/${l}${opts.path}`;
  const image = opts.image
    ? opts.image.startsWith("http")
      ? opts.image
      : `${base}${opts.image}`
    : `${base}/og.png`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: url(opts.locale),
      languages: { fr: url("fr"), ar: url("ar"), "x-default": url("fr") },
    },
    openGraph: {
      type: "website",
      siteName: "GH Cosmétique",
      locale: opts.locale === "ar" ? "ar_DZ" : "fr_DZ",
      title: opts.title,
      description: opts.description,
      url: url(opts.locale),
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: [image] },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
  };
}
