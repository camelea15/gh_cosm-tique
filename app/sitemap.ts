import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/data";
import { locales } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPaths = ["", "/produits", "/livraison", "/confidentialite"];
  let products: { slug: string }[] = [];
  try {
    products = await getProducts();
  } catch {
    /* base indisponible : on publie au moins les pages statiques */
  }
  const entries: MetadataRoute.Sitemap = [];
  for (const l of locales) {
    for (const p of staticPaths) {
      entries.push({
        url: `${base}/${l}${p}`,
        changeFrequency: p === "" ? "weekly" : "monthly",
        priority: p === "" ? 1 : 0.6,
        alternates: { languages: { fr: `${base}/fr${p}`, ar: `${base}/ar${p}` } },
      });
    }
    for (const pr of products) {
      entries.push({
        url: `${base}/${l}/produits/${pr.slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: { languages: { fr: `${base}/fr/produits/${pr.slug}`, ar: `${base}/ar/produits/${pr.slug}` } },
      });
    }
  }
  return entries;
}
