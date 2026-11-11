import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/admin/status-badge";
import { SubmitButton } from "@/components/admin/submit-button";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { DELIVERY_LABEL, STATUSES, STATUS_LABEL, da, formatDateTime } from "@/lib/admin-format";
import { displayPhone, phoneToIntl } from "@/lib/format";
import { updateOrderAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Détail de la commande" };

type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  wilaya_code: number;
  wilaya: string;
  commune: string | null;
  address: string | null;
  delivery_type: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  has_wholesale: boolean;
  suspicious_reason: string | null;
  customer_note: string | null;
  admin_note: string | null;
  created_at: Date;
  updated_at: Date;
};
type Item = { id: number; product_name: string; price_type: string; unit_price: number; quantity: number; line_total: number };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: rawId } = await params;
  if (!/^\d{1,12}$/.test(rawId)) notFound();
  const id = Number(rawId);

  const orders = await query<Order>(
    `SELECT o.id::int AS id, o.order_number, o.customer_name, o.phone, o.wilaya_code, w.name_fr AS wilaya, o.commune, o.address,
            o.delivery_type, o.subtotal, o.delivery_fee, o.total, o.status, o.has_wholesale, o.suspicious_reason,
            o.customer_note, o.admin_note, o.created_at, o.updated_at
     FROM orders o JOIN wilayas w ON w.code = o.wilaya_code WHERE o.id = $1`,
    [id],
  );
  const order = orders[0];
  if (!order) notFound();

  // L'ouverture de la commande la retire du compteur « nouvelles commandes ».
  await query(`UPDATE orders SET seen_at = now() WHERE id = $1 AND seen_at IS NULL`, [id]);
  const items = await query<Item>(
    `SELECT id::int AS id, product_name, price_type, unit_price, quantity, line_total FROM order_items WHERE order_id = $1 ORDER BY id`,
    [id],
  );

  const waText = `Bonjour ${order.customer_name}, ici GH Cosmétique. Nous vous contactons pour confirmer votre commande ${order.order_number} d'un montant de ${da(order.total).replace(/ /g, " ")} (livraison incluse). Pouvez-vous confirmer, s'il vous plaît ?`;
  const waHref = `https://wa.me/${phoneToIntl(order.phone)}?text=${encodeURIComponent(waText)}`;
  const update = updateOrderAction.bind(null, order.id);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand-700">
        <Icon name="arrow" size={14} className="rotate-180" />
        Toutes les commandes
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight" dir="ltr">
          {order.order_number}
        </h1>
        <StatusBadge status={order.status} />
        {order.has_wholesale && (
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase text-brand-800">Prix de gros</span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">Reçue le {formatDateTime(order.created_at)}</p>

      {order.suspicious_reason && (
        <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Commande à vérifier avant de livrer</p>
          <p className="mt-1">{order.suspicious_reason}</p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-700">Client</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Nom</dt>
                <dd className="mt-0.5 font-medium">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-muted">Téléphone</dt>
                <dd className="mt-0.5 font-medium" dir="ltr">
                  <a href={`tel:+${phoneToIntl(order.phone)}`} className="text-brand-700 hover:underline">
                    {displayPhone(order.phone)}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-muted">Wilaya</dt>
                <dd className="mt-0.5 font-medium">
                  {String(order.wilaya_code).padStart(2, "0")} - {order.wilaya}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Commune</dt>
                <dd className="mt-0.5 font-medium">{order.commune || "-"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">Livraison</dt>
                <dd className="mt-0.5 font-medium">
                  {DELIVERY_LABEL[order.delivery_type] ?? order.delivery_type}
                  {order.address ? ` · ${order.address}` : ""}
                </dd>
              </div>
              {order.customer_note && (
                <div className="sm:col-span-2">
                  <dt className="text-muted">Note du client</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap rounded-xl bg-brand-50 p-3 font-medium">{order.customer_note}</dd>
                </div>
              )}
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={`tel:+${phoneToIntl(order.phone)}`} className="btn btn-primary min-h-10 text-[13px]">
                <Icon name="phone" size={16} />
                Appeler
              </a>
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-outline min-h-10 text-[13px]">
                <Icon name="whatsapp" size={16} />
                Écrire sur WhatsApp
              </a>
            </div>
          </section>

          <section className="card overflow-x-auto">
            <h2 className="px-6 pt-6 text-sm font-semibold uppercase tracking-wider text-brand-700">Produits commandés</h2>
            <table className="mt-4 w-full min-w-[32rem] text-sm">
              <thead className="bg-brand-50 text-xs uppercase tracking-wider text-brand-800">
                <tr>
                  <th className="px-6 py-2.5 text-start font-semibold">Produit</th>
                  <th className="px-3 py-2.5 text-start font-semibold">Tarif</th>
                  <th className="px-3 py-2.5 text-end font-semibold">Prix</th>
                  <th className="px-3 py-2.5 text-end font-semibold">Qté</th>
                  <th className="px-6 py-2.5 text-end font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-6 py-3 font-medium">{it.product_name}</td>
                    <td className="px-3 py-3">
                      {it.price_type === "gros" ? (
                        <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-800">Gros</span>
                      ) : (
                        <span className="text-muted">Détail</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-end tabular-nums">{da(it.unit_price)}</td>
                    <td className="px-3 py-3 text-end tabular-nums">{it.quantity}</td>
                    <td className="px-6 py-3 text-end font-semibold tabular-nums">{da(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="space-y-2 border-t border-line px-6 py-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Sous-total</dt>
                <dd className="tabular-nums">{da(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Livraison ({DELIVERY_LABEL[order.delivery_type]})</dt>
                <dd className="tabular-nums">{da(order.delivery_fee)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
                <dt>Total à encaisser</dt>
                <dd className="tabular-nums text-brand-700">{da(order.total)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="card p-6 lg:sticky lg:top-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-700">Suivi</h2>
          <form action={update} className="mt-4 space-y-4">
            <div>
              <label htmlFor="status" className="label">
                Statut
              </label>
              <select id="status" name="status" defaultValue={order.status} className="field">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="admin_note" className="label">
                Note interne
              </label>
              <textarea
                id="admin_note"
                name="admin_note"
                defaultValue={order.admin_note ?? ""}
                maxLength={1000}
                className="field min-h-28 resize-y"
                placeholder="Visible uniquement par vous"
              />
            </div>
            <SubmitButton className="btn btn-primary min-h-11 w-full">Enregistrer</SubmitButton>
          </form>
          <p className="mt-4 text-xs text-muted">Dernière mise à jour : {formatDateTime(order.updated_at)}</p>
        </aside>
      </div>
    </div>
  );
}
