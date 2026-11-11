import type { Locale } from "@/lib/i18n";
import type { Category, Product, Wilaya } from "@/lib/data";

export function productName(p: Pick<Product, "name_fr" | "name_ar">, l: Locale): string {
  return l === "ar" && p.name_ar ? p.name_ar : p.name_fr;
}

export function productDescription(p: Pick<Product, "description_fr" | "description_ar">, l: Locale): string | null {
  return (l === "ar" ? p.description_ar || p.description_fr : p.description_fr) ?? null;
}

export function categoryName(c: Pick<Category, "name_fr" | "name_ar">, l: Locale): string {
  return l === "ar" ? c.name_ar : c.name_fr;
}

export function wilayaName(w: Pick<Wilaya, "name_fr" | "name_ar">, l: Locale): string {
  return l === "ar" ? w.name_ar : w.name_fr;
}
