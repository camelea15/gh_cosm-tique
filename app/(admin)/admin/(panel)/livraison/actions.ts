"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { audit, requireAdmin } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/data";
import { query } from "@/lib/db";

export type FeesState = { error?: string; ok?: boolean } | undefined;

export async function saveFeesAction(_prev: FeesState, formData: FormData): Promise<FeesState> {
  const admin = await requireAdmin();
  const rows: { code: number; sd: number; hm: number }[] = [];
  for (let code = 1; code <= 58; code++) {
    const sd = String(formData.get(`sd_${code}`) ?? "").trim();
    const hm = String(formData.get(`hm_${code}`) ?? "").trim();
    if (!/^\d{1,6}$/.test(sd) || !/^\d{1,6}$/.test(hm)) {
      return { error: `Tarif invalide pour la wilaya n° ${code} : entrez des nombres entiers.` };
    }
    rows.push({ code, sd: Number(sd), hm: Number(hm) });
  }
  await query(
    `UPDATE wilayas w SET fee_stopdesk = v.sd, fee_home = v.hm
     FROM jsonb_to_recordset($1::jsonb) AS v(code int, sd int, hm int)
     WHERE w.code = v.code AND (w.fee_stopdesk <> v.sd OR w.fee_home <> v.hm)`,
    [JSON.stringify(rows)],
  );
  await audit(admin.id, "fees_update");
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/livraison");
  return { ok: true };
}
