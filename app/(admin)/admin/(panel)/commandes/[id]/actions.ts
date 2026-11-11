"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { isStatus } from "@/lib/admin-format";

export async function updateOrderAction(orderId: number, formData: FormData) {
  const admin = await requireAdmin();
  if (!Number.isInteger(orderId) || orderId <= 0) return;

  const status = formData.get("status");
  const note = String(formData.get("admin_note") ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, 1000);

  const rows = await query<{ status: string }>(`SELECT status FROM orders WHERE id = $1`, [orderId]);
  const current = rows[0];
  if (!current) return;

  if (isStatus(status) && status !== current.status) {
    await query(`UPDATE orders SET status = $2, admin_note = $3, updated_at = now() WHERE id = $1`, [orderId, status, note || null]);
    await audit(admin.id, "order_status", `commande ${orderId}: ${current.status} -> ${status}`);
  } else {
    await query(`UPDATE orders SET admin_note = $2, updated_at = now() WHERE id = $1`, [orderId, note || null]);
    await audit(admin.id, "order_note", `commande ${orderId}`);
  }
  revalidatePath("/admin", "layout");
}

/** Suppression définitive : uniquement pour une commande déjà annulée (ex. commande de test). */
export async function deleteOrderAction(orderId: number) {
  const admin = await requireAdmin();
  if (!Number.isInteger(orderId) || orderId <= 0) return;
  const rows = await query<{ order_number: string }>(
    `DELETE FROM orders WHERE id = $1 AND status = 'annulee' RETURNING order_number`,
    [orderId],
  );
  if (rows.length === 0) return;
  await audit(admin.id, "order_delete", `commande ${rows[0].order_number} (id ${orderId})`);
  revalidatePath("/admin", "layout");
  redirect("/admin");
}
