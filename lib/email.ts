import { domainToASCII } from "node:url";

/**
 * Normalise une adresse e-mail : minuscules, sans espaces, domaine accentué converti en punycode
 * (les navigateurs de bureau le font tout seuls, certains navigateurs mobiles non).
 */
export function normalizeEmail(raw: string): string {
  const v = raw.trim().toLowerCase();
  const at = v.lastIndexOf("@");
  if (at < 1) return v;
  const domain = domainToASCII(v.slice(at + 1));
  return domain ? `${v.slice(0, at)}@${domain}` : v;
}
