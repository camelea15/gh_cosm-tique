import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { DELIVERY_LABEL, STATUSES, STATUS_LABEL, da, formatDateTime, isStatus } from "@/lib/admin-format";
import { displayPhone } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commandes" };

const PAGE_SIZE = 25;

type Search = { status?: string; q?: string; wilaya?: string; page?: string };

type OrderRow = {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  delivery_type: string;
  total: number;
  status: string;
  has_wholesale: boolean;
  suspicious_reason: string | null;
  seen_at: Date | null;
  created_at: Date;
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = isStatus(sp.status) ? sp.status : null;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const wilaya = /^\d{1,2}$/.test(sp.wilaya ?? "") ? Number(sp.wilaya) : null;
  const page = Math.max(1, Math.min(10_000, Number.parseInt(sp.page ?? "1", 10) || 1));

  // Les filtres sont construits avec des paramètres ($1, $2...) : aucune valeur n'est collée dans le texte SQL.
  const where: string[] = [];
  const params: unknown[] = [];
  if (status) {
    params.push(status);
    where.push(`o.status = $${params.length}`);
  }
  if (wilaya) {
    params.push(wilaya);
    where.push(`o.wilaya_code = $${params.length}`);
  }
  if (q) {
    params.push(`%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`);
    const n = params.length;
    where.push(`(o.customer_name ILIKE $${n} OR o.phone LIKE $${n} OR o.order_number ILIKE $${n})`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows, totalRows, counts, wilayas] = await Promise.all([
    query<OrderRow>(
      `SELECT o.id::int AS id, o.order_number, o.customer_name, o.phone, w.name_fr AS wilaya, o.delivery_type,
              o.total, o.status, o.has_wholesale, o.suspicious_reason, o.seen_at, o.created_at
       FROM orders o JOIN wilayas w ON w.code = o.wilaya_code
       ${whereSql}
       ORDER BY o.created_at DESC
       LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
      params,
    ),
    query<{ n: number }>(`SELECT count(*)::int AS n FROM orders o ${whereSql}`, params),
    query<{ status: string; n: number }>(`SELECT status, count(*)::int AS n FROM orders GROUP BY status`),
    query<{ code: number; name_fr: string }>(`SELECT code, name_fr FROM wilayas ORDER BY code`),
  ]);

  const total = totalRows[0]?.n ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const countOf = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const allCount = counts.reduce((s, c) => s + c.n, 0);

  const href = (over: Partial<Search>) => {
    const next = new URLSearchParams();
    const merged = { status: status ?? undefined, q: q || undefined, wilaya: wilaya ? String(wilaya) : undefined, page: undefined, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, String(v));
    const s = next.toString();
    return `/admin${s ? `?${s}` : ""}`;
  };

  const tab = (active: boolean) =>
    `inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition ${
      active ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-ink/80 hover:border-brand-300 hover:bg-brand-50"
    }`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Commandes</h1>
          <p className="mt-1 text-sm text-muted">
            {total} résultat(s) · {countOf("en_attente")} en attente · {countOf("a_verifier")} à vérifier
          </p>
        </div>
        <a href={`/admin/export${status ? `?status=${status}` : ""}`} className="btn btn-outline min-h-10 text-[13px]">
          Exporter en CSV
        </a>
      </div>

      <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={href({ status: undefined })} className={tab(!status)}>
          Toutes <span className="text-xs opacity-80">{allCount}</span>
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={href({ status: s })} className={tab(status === s)}>
            {STATUS_LABEL[s]} <span className="text-xs opacity-80">{countOf(s)}</span>
          </Link>
        ))}
      </div>

      <form method="get" action="/admin" className="mt-4 flex flex-wrap gap-3">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Nom, téléphone ou n° de commande"
          className="field min-w-64 flex-1 sm:max-w-sm"
          maxLength={80}
          aria-label="Rechercher une commande"
        />
        <select name="wilaya" defaultValue={wilaya ? String(wilaya) : ""} className="field w-auto" aria-label="Filtrer par wilaya">
          <option value="">Toutes les wilayas</option>
          {wilayas.map((w) => (
            <option key={w.code} value={w.code}>
              {String(w.code).padStart(2, "0")} - {w.name_fr}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary min-h-12">
          Filtrer
        </button>
      </form>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wider text-brand-800">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">Commande</th>
              <th className="px-4 py-3 text-start font-semibold">Date</th>
              <th className="px-4 py-3 text-start font-semibold">Client</th>
              <th className="px-4 py-3 text-start font-semibold">Wilaya</th>
              <th className="px-4 py-3 text-start font-semibold">Livraison</th>
              <th className="px-4 py-3 text-end font-semibold">Total</th>
              <th className="px-4 py-3 text-start font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((o) => {
              const isNew = !o.seen_at && (o.status === "en_attente" || o.status === "a_verifier");
              return (
                <tr key={o.id} className="transition hover:bg-brand-50/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/commandes/${o.id}`} className="flex items-center gap-2 font-semibold text-brand-700 hover:underline">
                      {isNew && <span className="h-2 w-2 rounded-full bg-brand-600" title="Nouvelle commande" aria-label="Nouvelle commande" />}
                      <span dir="ltr">{o.order_number}</span>
                    </Link>
                    <div className="mt-1 flex gap-1.5">
                      {o.has_wholesale && (
                        <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-800">Prix de gros</span>
                      )}
                      {o.suspicious_reason && (
                        <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700" title={o.suspicious_reason}>
                          Suspect
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(o.created_at)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.customer_name}</p>
                    <p className="text-xs text-muted" dir="ltr">
                      {displayPhone(o.phone)}
                    </p>
                  </td>
                  <td className="px-4 py-3">{o.wilaya}</td>
                  <td className="px-4 py-3">{DELIVERY_LABEL[o.delivery_type] ?? o.delivery_type}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-end font-semibold tabular-nums">{da(o.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-10 text-center text-muted">Aucune commande pour le moment.</p>}
      </div>

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Pagination">
          {page > 1 ? (
            <Link href={href({ page: String(page - 1) })} className="btn btn-outline min-h-10">
              Précédent
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {page} sur {pages}
          </span>
          {page < pages ? (
            <Link href={href({ page: String(page + 1) })} className="btn btn-outline min-h-10">
              Suivant
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
