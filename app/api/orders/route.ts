import { NextResponse } from "next/server";
import { clientIpFrom, hashValue, isSameOrigin, rateLimit } from "@/lib/security";
import { createOrder, orderSchema } from "@/lib/orders";
import { normalizePhone } from "@/lib/format";

export const dynamic = "force-dynamic";

function fail(status: number, error: string, fields?: string[]) {
  return NextResponse.json({ ok: false, error, fields }, { status });
}

export async function POST(req: Request) {
  // 1. Protection CSRF : la requête doit venir de notre propre site.
  if (!isSameOrigin(req.headers)) return fail(403, "forbidden");

  const ipHash = hashValue(clientIpFrom(req.headers));

  // 2. Limite générale par adresse IP (protège la base contre le spam de requêtes).
  if (!(await rateLimit("order-attempt-ip", ipHash, 30, 600))) return fail(429, "rate");

  // 3. Taille et format du corps de la requête.
  const raw = await req.text();
  if (raw.length > 20_000) return fail(413, "too_large");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "bad_json");
  }

  // 4. Validation stricte de toutes les entrées.
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => String(i.path[0] ?? "")))].filter(Boolean);
    return fail(400, "validation", fields);
  }
  const data = parsed.data;

  // 5. Champ piège : un humain ne le voit pas. On répond « succès » pour ne rien apprendre au robot.
  if (data.website.length > 0) {
    return NextResponse.json({ ok: true, orderNumber: "GH-" + hashValue(raw).slice(0, 6).toUpperCase(), total: 0 });
  }
  // Formulaire envoyé trop vite pour un humain.
  if (data.openedAt && Date.now() - data.openedAt < 2500) return fail(429, "too_fast");

  // 6. Limites sur les vraies commandes : par IP et par numéro de téléphone.
  const phone = normalizePhone(data.phone)!;
  if (!(await rateLimit("order-ip-10m", ipHash, 5, 600))) return fail(429, "rate");
  if (!(await rateLimit("order-ip-day", ipHash, 20, 86_400))) return fail(429, "rate");
  if (!(await rateLimit("order-phone-hour", hashValue(phone), 3, 3600))) return fail(429, "rate");

  // 7. Création : prix et total sont recalculés côté serveur.
  const result = await createOrder(data, ipHash);
  if (!result.ok) {
    if (result.code === "stock") return fail(409, "stock");
    if (result.code === "invalid_items" || result.code === "invalid_wilaya") return fail(400, "invalid_items");
    return fail(500, "error");
  }
  return NextResponse.json({ ok: true, orderNumber: result.orderNumber, total: result.total });
}
