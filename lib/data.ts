import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";

export type Category = { id: number; slug: string; name_fr: string; name_ar: string };

export type Product = {
  id: number;
  slug: string;
  name_fr: string;
  name_ar: string | null;
  description_fr: string | null;
  description_ar: string | null;
  category_id: number | null;
  category_slug: string | null;
  price_retail: number;
  price_wholesale: number;
  image_url: string | null;
  stock: number | null;
  sort_order: number;
};

export type Wilaya = {
  code: number;
  name_fr: string;
  name_ar: string;
  fee_stopdesk: number;
  fee_home: number;
};

// Le catalogue est mis en cache 5 minutes ; le dashboard l'invalide immédiatement (tag "catalog") à chaque modification.
export const CATALOG_TAG = "catalog";

export const getCategories = unstable_cache(
  async (): Promise<Category[]> =>
    query<Category>(`SELECT id, slug, name_fr, name_ar FROM categories ORDER BY sort_order, id`),
  ["categories-v1"],
  { tags: [CATALOG_TAG], revalidate: 300 },
);

export const getProducts = unstable_cache(
  async (): Promise<Product[]> =>
    query<Product>(
      `SELECT p.id, p.slug, p.name_fr, p.name_ar, p.description_fr, p.description_ar, p.category_id,
              c.slug AS category_slug, p.price_retail, p.price_wholesale, p.image_url, p.stock, p.sort_order
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_active
       ORDER BY p.sort_order, p.id`,
    ),
  ["products-v1"],
  { tags: [CATALOG_TAG], revalidate: 300 },
);

export const getWilayas = unstable_cache(
  async (): Promise<Wilaya[]> =>
    query<Wilaya>(`SELECT code, name_fr, name_ar, fee_stopdesk, fee_home FROM wilayas ORDER BY code`),
  ["wilayas-v1"],
  { tags: [CATALOG_TAG], revalidate: 300 },
);

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
}
