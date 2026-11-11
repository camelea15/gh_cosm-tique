"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, requireAdmin } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/data";
import { query } from "@/lib/db";

export type ProductFormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean } | undefined;

const clean = (max: number) =>
  z
    .string()
    .max(max * 2)
    .transform((s) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim())
    .pipe(z.string().max(max));

const intField = (min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,9}$/, "Entrez un nombre entier")
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

const schema = z.object({
  name_fr: clean(120).pipe(z.string().min(2, "Le nom est obligatoire")),
  name_ar: clean(120),
  description_fr: clean(1500),
  description_ar: clean(1500),
  category_id: z.string().trim().regex(/^\d{0,9}$/, "Catégorie invalide"),
  price_retail: intField(0, 10_000_000),
  price_wholesale: intField(0, 10_000_000),
  stock: z.string().trim().regex(/^\d{0,9}$/, "Stock invalide"),
  image_url: clean(500).refine((v) => v === "" || /^\/products\/[A-Za-z0-9._\-/]{1,200}$/.test(v) || /^https:\/\/\S{4,480}$/.test(v), {
    message: "Entrez un chemin comme /products/nom.webp ou un lien https://",
  }),
  sort_order: intField(0, 100000),
});

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  const root = base || "produit";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const rows = await query(`SELECT 1 FROM products WHERE slug = $1`, [candidate]);
    if (rows.length === 0) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function saveProductAction(id: number | null, _prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const admin = await requireAdmin();

  const raw = Object.fromEntries(
    ["name_fr", "name_ar", "description_fr", "description_ar", "category_id", "price_retail", "price_wholesale", "stock", "image_url", "sort_order"].map(
      (k) => [k, String(formData.get(k) ?? "")],
    ),
  );
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Vérifiez les champs signalés.", fieldErrors };
  }
  const v = parsed.data;
  const isActive = formData.get("is_active") === "on";
  const categoryId = v.category_id ? Number(v.category_id) : null;
  const stock = v.stock === "" ? null : Number(v.stock);

  if (categoryId !== null) {
    const exists = await query(`SELECT 1 FROM categories WHERE id = $1`, [categoryId]);
    if (exists.length === 0) return { error: "Catégorie inconnue.", fieldErrors: { category_id: "Catégorie inconnue" } };
  }

  if (id === null) {
    const slug = await uniqueSlug(slugify(v.name_fr));
    const rows = await query<{ id: number }>(
      `INSERT INTO products (slug, name_fr, name_ar, description_fr, description_ar, category_id, price_retail, price_wholesale,
                             image_url, stock, is_active, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [slug, v.name_fr, v.name_ar || null, v.description_fr || null, v.description_ar || null, categoryId, v.price_retail,
       v.price_wholesale, v.image_url || null, stock, isActive, v.sort_order],
    );
    await audit(admin.id, "product_create", `${rows[0].id} ${v.name_fr}`);
    revalidateTag(CATALOG_TAG);
    revalidatePath("/admin/produits");
    redirect(`/admin/produits/${rows[0].id}?saved=1`);
  }

  const updated = await query(
    `UPDATE products SET name_fr=$2, name_ar=$3, description_fr=$4, description_ar=$5, category_id=$6, price_retail=$7,
            price_wholesale=$8, image_url=$9, stock=$10, is_active=$11, sort_order=$12, updated_at=now()
     WHERE id=$1 RETURNING id`,
    [id, v.name_fr, v.name_ar || null, v.description_fr || null, v.description_ar || null, categoryId, v.price_retail,
     v.price_wholesale, v.image_url || null, stock, isActive, v.sort_order],
  );
  if (updated.length === 0) return { error: "Produit introuvable." };
  await audit(admin.id, "product_update", `${id} ${v.name_fr}`);
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/produits");
  return { ok: true };
}

export async function toggleProductAction(id: number, active: boolean) {
  const admin = await requireAdmin();
  if (!Number.isInteger(id) || id <= 0) return;
  await query(`UPDATE products SET is_active = $2, updated_at = now() WHERE id = $1`, [id, active]);
  await audit(admin.id, active ? "product_show" : "product_hide", String(id));
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/produits");
}
