import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = /^([a-f0-9]{24})\.webp$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  const rows = await query<{ data_b64: string }>(`SELECT data_b64 FROM images WHERE id = $1`, [m[1]]);
  if (!rows[0]) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(rows[0].data_b64, "base64"), {
    headers: {
      "Content-Type": "image/webp",
      // L'identifiant est aléatoire et ne change jamais pour une même photo : cache long possible.
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
