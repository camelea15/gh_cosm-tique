import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { saveProductAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Modifier le produit" };

type P = {
  id: number;
  slug: string;
  name_fr: string;
  name_ar: string | null;
  description_fr: string | null;
  description_ar: string | null;
  category_id: number | null;
  price_retail: number;
  price_wholesale: number;
  stock: number | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { id: rawId } = await params;
  if (!/^\d{1,9}$/.test(rawId)) notFound();
  const id = Number(rawId);
  const { saved } = await searchParams;

  const [rows, categories] = await Promise.all([
    query<P>(
      `SELECT id, slug, name_fr, name_ar, description_fr, description_ar, category_id, price_retail, price_wholesale,
              stock, image_url, sort_order, is_active FROM products WHERE id = $1`,
      [id],
    ),
    query<{ id: number; name_fr: string }>(`SELECT id, name_fr FROM categories ORDER BY sort_order, id`),
  ]);
  const p = rows[0];
  if (!p) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/produits" className="text-sm text-muted hover:text-brand-700">
        ← Tous les produits
      </Link>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{p.name_fr}</h1>
        <Link href={`/fr/produits/${p.slug}`} target="_blank" className="text-sm font-medium text-brand-700 hover:underline">
          Voir sur le site ↗
        </Link>
      </div>
      <div className="mt-6">
        <ProductForm
          action={saveProductAction.bind(null, p.id)}
          categories={categories}
          saved={saved === "1"}
          values={{
            name_fr: p.name_fr,
            name_ar: p.name_ar ?? "",
            description_fr: p.description_fr ?? "",
            description_ar: p.description_ar ?? "",
            category_id: p.category_id ? String(p.category_id) : "",
            price_retail: String(p.price_retail),
            price_wholesale: String(p.price_wholesale),
            stock: p.stock === null ? "" : String(p.stock),
            image_url: p.image_url ?? "",
            sort_order: String(p.sort_order),
            is_active: p.is_active,
          }}
        />
      </div>
    </div>
  );
}
