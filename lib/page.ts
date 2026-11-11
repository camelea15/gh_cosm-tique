import { notFound } from "next/navigation";
import { getDict, isLocale, type Dict, type Locale } from "@/lib/i18n";

/** Lit et valide la langue dans l'URL (/fr ou /ar). Toute autre valeur renvoie une page 404. */
export async function resolveLocale(params: Promise<{ lang: string }>): Promise<{ locale: Locale; t: Dict }> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return { locale: lang, t: getDict(lang) };
}
