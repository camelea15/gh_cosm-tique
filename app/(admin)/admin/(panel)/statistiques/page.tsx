import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { STATUSES, STATUS_LABEL, da } from "@/lib/admin-format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Statistiques" };

export default async function StatsPage() {
  await requireAdmin();

  const [kpi, byStatus, daily, topProducts, topWilayas] = await Promise.all([
    query<{ orders_30: number; revenue_30: number; avg_basket: number; orders_total: number; revenue_total: number }>(
      `SELECT
         count(*) FILTER (WHERE created_at > now() - interval '30 days' AND status <> 'annulee')::int AS orders_30,
         coalesce(sum(total) FILTER (WHERE created_at > now() - interval '30 days' AND status IN ('confirmee','livree')), 0)::int AS revenue_30,
         coalesce(avg(total) FILTER (WHERE status IN ('confirmee','livree')), 0)::int AS avg_basket,
         count(*)::int AS orders_total,
         coalesce(sum(total) FILTER (WHERE status IN ('confirmee','livree')), 0)::int AS revenue_total
       FROM orders`,
    ),
    query<{ status: string; n: number }>(`SELECT status, count(*)::int AS n FROM orders GROUP BY status`),
    query<{ d: string; n: number; revenue: number }>(
      `SELECT to_char((created_at AT TIME ZONE 'Africa/Algiers')::date, 'YYYY-MM-DD') AS d, count(*)::int AS n,
              coalesce(sum(total) FILTER (WHERE status IN ('confirmee','livree')), 0)::int AS revenue
       FROM orders WHERE created_at > now() - interval '30 days' AND status <> 'annulee'
       GROUP BY 1 ORDER BY 1`,
    ),
    query<{ product_name: string; qty: number; revenue: number }>(
      `SELECT oi.product_name, sum(oi.quantity)::int AS qty, sum(oi.line_total)::int AS revenue
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.status <> 'annulee' GROUP BY oi.product_name ORDER BY qty DESC, revenue DESC LIMIT 8`,
    ),
    query<{ wilaya: string; n: number }>(
      `SELECT w.name_fr AS wilaya, count(*)::int AS n
       FROM orders o JOIN wilayas w ON w.code = o.wilaya_code
       WHERE o.status <> 'annulee' GROUP BY w.name_fr ORDER BY n DESC LIMIT 8`,
    ),
  ]);

  const k = kpi[0];
  const maxDaily = Math.max(1, ...daily.map((d) => d.n));
  const maxQty = Math.max(1, ...topProducts.map((p) => p.qty));
  const maxW = Math.max(1, ...topWilayas.map((w) => w.n));
  const countOf = (s: string) => byStatus.find((b) => b.status === s)?.n ?? 0;

  const cards = [
    { label: "Commandes (30 jours)", value: String(k.orders_30), hint: "hors annulées" },
    { label: "Chiffre d'affaires (30 jours)", value: da(k.revenue_30), hint: "commandes confirmées et livrées" },
    { label: "Panier moyen", value: da(k.avg_basket), hint: "commandes confirmées et livrées" },
    { label: "Chiffre d'affaires total", value: da(k.revenue_total), hint: `${k.orders_total} commande(s) au total` },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Statistiques</h1>
      <p className="mt-1 text-sm text-muted">Le chiffre d&apos;affaires ne compte que les commandes confirmées ou livrées (livraison incluse).</p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{c.label}</dt>
            <dd className="mt-2 text-2xl font-bold text-brand-700">{c.value}</dd>
            <p className="mt-1 text-xs text-muted">{c.hint}</p>
          </div>
        ))}
      </dl>

      <section className="card mt-6 p-6">
        <h2 className="font-semibold">Commandes par jour (30 derniers jours)</h2>
        {daily.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Pas encore de commande sur cette période.</p>
        ) : (
          <div className="mt-6 flex h-44 items-end gap-1.5 overflow-x-auto" role="img" aria-label="Histogramme des commandes par jour">
            {daily.map((d) => (
              <div key={d.d} className="group flex min-w-6 flex-1 flex-col items-center justify-end gap-1" title={`${d.d} : ${d.n} commande(s)`}>
                <span className="text-[10px] font-semibold text-brand-700">{d.n}</span>
                <div className="w-full rounded-t-md bg-brand-500 transition group-hover:bg-brand-700" style={{ height: `${Math.max(6, (d.n / maxDaily) * 130)}px` }} />
                <span className="text-[10px] text-muted">{d.d.slice(8)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-semibold">Produits les plus commandés</h2>
          {topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Aucune donnée.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topProducts.map((p) => (
                <li key={p.product_name}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{p.product_name}</span>
                    <span className="shrink-0 tabular-nums text-muted">{p.qty} u.</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-brand-50">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="font-semibold">Wilayas les plus actives</h2>
          {topWilayas.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Aucune donnée.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topWilayas.map((w) => (
                <li key={w.wilaya}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium">{w.wilaya}</span>
                    <span className="tabular-nums text-muted">{w.n}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-brand-50">
                    <div className="h-2 rounded-full bg-brand-400" style={{ width: `${(w.n / maxW) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-6 p-6">
        <h2 className="font-semibold">Répartition par statut</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-5">
          {STATUSES.map((s) => (
            <li key={s} className="rounded-xl bg-brand-50/60 p-4 text-center">
              <p className="text-2xl font-bold text-brand-700">{countOf(s)}</p>
              <p className="mt-1 text-xs text-muted">{STATUS_LABEL[s]}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
