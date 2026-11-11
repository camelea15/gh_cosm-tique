import { z } from "zod";
import { randomInt } from "node:crypto";
import { query } from "@/lib/db";
import { normalizePhone } from "@/lib/format";

// Nettoie un texte : retire les caractères de contrôle, réduit les espaces.
const text = (min: number, max: number) =>
  z
    .string()
    .max(max * 3)
    .transform((s) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(min).max(max));

export const orderSchema = z
  .object({
    name: text(2, 80),
    phone: z.string().max(40),
    wilaya: z.number().int().min(1).max(58),
    commune: text(0, 80).default(""),
    address: text(0, 200).default(""),
    deliveryType: z.enum(["stopdesk", "domicile"]),
    note: text(0, 300).default(""),
    consent: z.literal(true),
    website: z.string().max(200).default(""), // champ piège (honeypot) : doit rester vide
    openedAt: z.number().int().optional(), // moment d'ouverture du formulaire (anti-robot)
    items: z
      .array(
        z.object({
          id: z.number().int().positive(),
          priceType: z.enum(["detail", "gros"]),
          qty: z.number().int().min(1).max(20),
        }),
      )
      .min(1)
      .max(30),
  })
  .superRefine((v, ctx) => {
    if (v.deliveryType === "domicile" && v.address.length < 5) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "address" });
    }
    if (normalizePhone(v.phone) === null) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "phone" });
    }
  });

export type OrderInput = z.infer<typeof orderSchema>;

export type CreateOrderResult =
  | { ok: true; orderNumber: string; total: number }
  | { ok: false; code: "stock" | "invalid_items" | "invalid_wilaya" | "error" };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newOrderNumber(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `GH-${s}`;
}

type ProductRow = {
  id: number;
  name_fr: string;
  price_retail: number;
  price_wholesale: number;
  stock: number | null;
};

/**
 * Crée une commande. IMPORTANT : les prix et le total sont TOUJOURS recalculés ici à partir de la base de données.
 * Le navigateur n'envoie que des identifiants de produits, des quantités et le type de tarif.
 */
export async function createOrder(input: OrderInput, ipHash: string): Promise<CreateOrderResult> {
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, code: "error" };

  // Regroupe les lignes qui concernent le même produit et le même tarif.
  const merged = new Map<string, { id: number; priceType: "detail" | "gros"; qty: number }>();
  for (const it of input.items) {
    const key = `${it.id}:${it.priceType}`;
    const prev = merged.get(key);
    if (prev) prev.qty += it.qty;
    else merged.set(key, { ...it });
  }
  const lines = [...merged.values()];
  if (lines.some((l) => l.qty > 100)) return { ok: false, code: "invalid_items" };

  const ids = [...new Set(lines.map((l) => l.id))];
  const products = await query<ProductRow>(
    `SELECT id, name_fr, price_retail, price_wholesale, stock FROM products WHERE is_active AND id = ANY($1::int[])`,
    [ids],
  );
  const byId = new Map(products.map((p) => [p.id, p]));
  if (ids.some((id) => !byId.has(id))) return { ok: false, code: "invalid_items" };

  const qtyPerProduct = new Map<number, number>();
  for (const l of lines) qtyPerProduct.set(l.id, (qtyPerProduct.get(l.id) ?? 0) + l.qty);
  for (const [id, qty] of qtyPerProduct) {
    const p = byId.get(id)!;
    if (p.stock !== null && p.stock < qty) return { ok: false, code: "stock" };
  }

  const wilayaRows = await query<{ fee_stopdesk: number; fee_home: number }>(
    `SELECT fee_stopdesk, fee_home FROM wilayas WHERE code = $1`,
    [input.wilaya],
  );
  if (!wilayaRows[0]) return { ok: false, code: "invalid_wilaya" };

  const deliveryFee = input.deliveryType === "stopdesk" ? wilayaRows[0].fee_stopdesk : wilayaRows[0].fee_home;

  const itemRows = lines.map((l) => {
    const p = byId.get(l.id)!;
    const unit = l.priceType === "gros" ? p.price_wholesale : p.price_retail;
    return {
      product_id: p.id,
      product_name: p.name_fr,
      price_type: l.priceType,
      unit_price: unit,
      quantity: l.qty,
      line_total: unit * l.qty,
    };
  });
  const subtotal = itemRows.reduce((s, r) => s + r.line_total, 0);
  const total = subtotal + deliveryFee;
  const hasWholesale = itemRows.some((r) => r.price_type === "gros");

  // Détection des commandes suspectes : la commande est enregistrée mais marquée « à vérifier ».
  const reasons: string[] = [];
  const recent = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM orders
     WHERE phone = $1 AND status <> 'annulee' AND created_at > now() - interval '30 minutes'`,
    [phone],
  );
  if ((recent[0]?.n ?? 0) > 0) reasons.push("Doublon possible : même numéro de téléphone dans les 30 dernières minutes");

  const otherNames = await query<{ n: number }>(
    `SELECT count(DISTINCT lower(customer_name))::int AS n FROM orders
     WHERE phone = $1 AND created_at > now() - interval '24 hours' AND lower(customer_name) <> lower($2)`,
    [phone, input.name],
  );
  if ((otherNames[0]?.n ?? 0) > 0) reasons.push("Même numéro utilisé avec un autre nom en 24 h");
  if (total > 80000) reasons.push("Montant inhabituellement élevé");

  const status = reasons.length > 0 ? "a_verifier" : "en_attente";

  for (let attempt = 0; attempt < 4; attempt++) {
    const orderNumber = newOrderNumber();
    try {
      await query(
        `WITH o AS (
           INSERT INTO orders (order_number, customer_name, phone, wilaya_code, commune, address, delivery_type,
                               subtotal, delivery_fee, total, status, has_wholesale, suspicious_reason, customer_note, ip_hash)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
           RETURNING id
         )
         INSERT INTO order_items (order_id, product_id, product_name, price_type, unit_price, quantity, line_total)
         SELECT o.id, x.product_id, x.product_name, x.price_type, x.unit_price, x.quantity, x.line_total
         FROM o, jsonb_to_recordset($16::jsonb) AS x(
           product_id int, product_name text, price_type text, unit_price int, quantity int, line_total int
         )
         RETURNING order_id`,
        [
          orderNumber,
          input.name,
          phone,
          input.wilaya,
          input.commune || null,
          input.address || null,
          input.deliveryType,
          subtotal,
          deliveryFee,
          total,
          status,
          hasWholesale,
          reasons.length ? reasons.join(" ; ") : null,
          input.note || null,
          ipHash,
          JSON.stringify(itemRows),
        ],
      );
      return { ok: true, orderNumber, total };
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "23505") continue; // numéro de commande déjà pris : on en génère un autre
      console.error("createOrder failed", (err as Error).message);
      return { ok: false, code: "error" };
    }
  }
  return { ok: false, code: "error" };
}
