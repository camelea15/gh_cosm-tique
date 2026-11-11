import Image from "next/image";
import Link from "next/link";
import { SubmitButton } from "@/components/admin/submit-button";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { da } from "@/lib/admin-format";
import { toggleProductAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produits" };

type Row = {
  id: number;
  name_fr: string;
  category: string | null;
  price_retail: number;
  price_wholesale: number;
  stock: number | null;
  image_url: string | null;
  is_active: boolean;
};

export default async function ProductsAdminPage() {
  await requireAdmin();
  const rows = await query<Row>(
    `SELECT p.id, p.name_fr, c.name_fr AS category, p.price_retail, p.price_wholesale, p.stock, p.image_url, p.is_active
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.sort_order, p.id`,
  );
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Produits</h1>
          <p className="mt-1 text-sm text-muted">
            {rows.length} produit(s) · {rows.filter((r) => r.is_active).length} visible(s) sur le site
          </p>
        </div>
        <Link href="/admin/produits/nouveau" className="btn btn-primary min-h-11">
          Ajouter un produit
        </Link>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wider text-brand-800">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">Produit</th>
              <th className="px-4 py-3 text-start font-semibold">Catégorie</th>
              <th className="px-4 py-3 text-end font-semibold">Détail</th>
              <th className="px-4 py-3 text-end font-semibold">Gros</th>
              <th className="px-4 py-3 text-end font-semibold">Stock</th>
              <th className="px-4 py-3 text-start font-semibold">Visibilité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => (
              <tr key={p.id} className={p.is_active ? "hover:bg-brand-50/50" : "bg-zinc-50 text-zinc-500"}>
                <td className="px-4 py-3">
                  <Link href={`/admin/produits/${p.id}`} className="flex items-center gap-3 font-medium text-ink hover:text-brand-700">
                    <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                      {p.image_url ? (
                        <Image src={p.image_url} alt="" fill sizes="40px" className="object-cover" unoptimized={p.image_url.startsWith("http")} />
                      ) : (
                        <Image src="/logo.png" alt="" fill sizes="40px" className="object-contain p-1 opacity-30" />
                      )}
                    </span>
                    {p.name_fr}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.category ?? "-"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-end tabular-nums">{da(p.price_retail)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-end tabular-nums">{da(p.price_wholesale)}</td>
                <td className="px-4 py-3 text-end tabular-nums">{p.stock === null ? "∞" : p.stock}</td>
                <td className="px-4 py-3">
                  <form action={toggleProductAction.bind(null, p.id, !p.is_active)}>
                    <SubmitButton
                      pendingLabel="…"
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition ${
                        p.is_active
                          ? "bg-emerald-50 text-emerald-800 ring-emerald-200 hover:bg-emerald-100"
                          : "bg-zinc-100 text-zinc-600 ring-zinc-200 hover:bg-zinc-200"
                      }`}
                    >
                      {p.is_active ? "Visible" : "Masqué"}
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
