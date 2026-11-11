import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { saveProductAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nouveau produit" };

export default async function NewProductPage() {
  await requireAdmin();
  const [categories, max] = await Promise.all([
    query<{ id: number; name_fr: string }>(`SELECT id, name_fr FROM categories ORDER BY sort_order, id`),
    query<{ n: number }>(`SELECT coalesce(max(sort_order), 0)::int + 1 AS n FROM products`),
  ]);
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/produits" className="text-sm text-muted hover:text-brand-700">
        ← Tous les produits
      </Link>
      <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight">Nouveau produit</h1>
      <div className="mt-6">
        <ProductForm
          action={saveProductAction.bind(null, null)}
          categories={categories}
          values={{
            name_fr: "",
            name_ar: "",
            description_fr: "",
            description_ar: "",
            category_id: "",
            price_retail: "",
            price_wholesale: "",
            stock: "",
            image_url: "",
            extra_images: "",
            sort_order: String(max[0]?.n ?? 1),
            is_active: true,
          }}
        />
      </div>
    </div>
  );
}
