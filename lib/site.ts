export const SITE = {
  name: "GH Cosmétique",
  city: "Oran",
  country: "Algérie",
  whatsappIntl: "213540152780",
  whatsappDisplay: "05 40 15 27 80",
  instagram: "https://www.instagram.com/gh.cosmetique",
  tiktok: "https://www.tiktok.com/@gh.cosmetique31",
  facebook: "https://www.facebook.com/share/1FRmxv4JZV/",
} as const;

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${SITE.whatsappIntl}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
