"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, audit, currentIpHash, hashPassword, passwordProblem, requireAdmin, verifyPassword } from "@/lib/auth";
import { query } from "@/lib/db";
import { rateLimit, sha256 } from "@/lib/security";

export type PwState = { error?: string; ok?: boolean } | undefined;

export async function changePasswordAction(_prev: PwState, formData: FormData): Promise<PwState> {
  const admin = await requireAdmin();
  if (!(await rateLimit("admin-pw-change", await currentIpHash(), 6, 900))) {
    return { error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const rows = await query<{ password_hash: string }>(`SELECT password_hash FROM admins WHERE id = $1`, [admin.id]);
  if (!(await verifyPassword(current, rows[0]?.password_hash ?? null))) return { error: "Le mot de passe actuel est incorrect." };
  const problem = passwordProblem(next);
  if (problem) return { error: problem };
  if (next !== confirm) return { error: "Les deux nouveaux mots de passe ne correspondent pas." };
  if (next === current) return { error: "Le nouveau mot de passe doit être différent de l'ancien." };

  await query(`UPDATE admins SET password_hash = $2, failed_attempts = 0, locked_until = NULL WHERE id = $1`, [
    admin.id,
    await hashPassword(next),
  ]);
  // Par sécurité, toutes les autres sessions ouvertes sont fermées.
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  await query(`DELETE FROM admin_sessions WHERE admin_id = $1 AND token_hash <> $2`, [admin.id, sha256(token)]);
  await audit(admin.id, "password_change");
  return { ok: true };
}

export async function logoutEverywhereAction() {
  const admin = await requireAdmin();
  await query(`DELETE FROM admin_sessions WHERE admin_id = $1`, [admin.id]);
  await audit(admin.id, "logout_all");
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
  redirect("/admin/login");
}
