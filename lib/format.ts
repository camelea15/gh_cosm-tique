import type { Locale } from "@/lib/i18n";

export function formatDA(n: number, locale: Locale): string {
  const s = new Intl.NumberFormat("fr-FR").format(n).replace(/[  ]/g, " ");
  return locale === "ar" ? `${s} د.ج` : `${s} DA`;
}

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";

/**
 * Normalise un numéro de téléphone mobile algérien vers le format national 0X XX XX XX XX (10 chiffres).
 * Accepte +213, 00213, espaces, tirets et chiffres arabes. Retourne null si invalide.
 */
export function normalizePhone(input: string): string | null {
  let p = input.replace(/[\s.\-()]/g, "");
  p = p.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)));
  if (p.startsWith("+213")) p = "0" + p.slice(4);
  else if (p.startsWith("00213")) p = "0" + p.slice(5);
  else if (p.startsWith("213") && p.length === 12) p = "0" + p.slice(3);
  return /^0[567]\d{8}$/.test(p) ? p : null;
}

export function phoneToIntl(phone: string): string {
  return "213" + phone.replace(/^0/, "");
}

export function displayPhone(phone: string): string {
  return phone.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4");
}
