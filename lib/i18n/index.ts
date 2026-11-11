import { fr } from "./fr";
import { ar } from "./ar";

export const locales = ["fr", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

type DeepStr<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? DeepStr<U>[]
    : { [K in keyof T]: DeepStr<T[K]> };

export type Dict = DeepStr<typeof fr>;

const dictionaries: Record<Locale, Dict> = { fr, ar };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getDict(locale: Locale): Dict {
  return dictionaries[locale];
}

export function dirOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Remplace {cle} par la valeur correspondante dans un texte traduit. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));
}
