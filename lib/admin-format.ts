export const STATUSES = ["a_verifier", "en_attente", "confirmee", "livree", "annulee"] as const;
export type Status = (typeof STATUSES)[number];

export function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

export const STATUS_LABEL: Record<Status, string> = {
  a_verifier: "À vérifier",
  en_attente: "En attente",
  confirmee: "Confirmée",
  livree: "Livrée",
  annulee: "Annulée",
};

export const STATUS_STYLE: Record<Status, string> = {
  a_verifier: "bg-red-50 text-red-700 ring-red-200",
  en_attente: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmee: "bg-sky-50 text-sky-800 ring-sky-200",
  livree: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  annulee: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export const DELIVERY_LABEL: Record<string, string> = {
  stopdesk: "Stop desk",
  domicile: "À domicile",
};

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Africa/Algiers",
});

export function formatDateTime(d: Date | string): string {
  return dateFmt.format(new Date(d));
}

export function da(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(n).replace(/[  ]/g, " ")} DA`;
}

/** Neutralise l'injection de formules dans Excel/Sheets (cellules commençant par = + - @). */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
