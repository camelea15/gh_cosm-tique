import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { audit, getAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { processProductImage } from "@/lib/images";
import { isSameOrigin, rateLimit } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024; // limite de Vercel : 4,5 Mo par requête

export async function POST(req: Request) {
  if (!isSameOrigin(req.headers)) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Session expirée. Reconnectez-vous." }, { status: 401 });
  if (!(await rateLimit("admin-upload", String(admin.id), 80, 3600))) {
    return NextResponse.json({ error: "Trop d'envois. Réessayez plus tard." }, { status: 429 });
  }
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES + 4096) return NextResponse.json({ error: "Photo trop lourde (4 Mo maximum)." }, { status: 413 });

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Envoi invalide." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Aucune photo reçue." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Photo trop lourde (4 Mo maximum)." }, { status: 413 });

  let out: Buffer;
  try {
    out = await processProductImage(Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "Ce fichier n'est pas une image valide (utilisez JPG, PNG ou WebP)." }, { status: 400 });
  }
  const id = randomBytes(12).toString("hex");
  await query(`INSERT INTO images (id, data_b64, bytes) VALUES ($1, $2, $3)`, [id, out.toString("base64"), out.length]);
  await audit(admin.id, "image_upload", id);
  return NextResponse.json({ url: `/img/${id}.webp` });
}
