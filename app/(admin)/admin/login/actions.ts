"use server";

import { redirect } from "next/navigation";
import { audit, createSession, currentIpHash, verifyPassword } from "@/lib/auth";
import { query } from "@/lib/db";
import { normalizeEmail } from "@/lib/email";
import { rateLimit } from "@/lib/security";

export type FormState = { error?: string } | undefined;

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeEmail(String(formData.get("email") ?? "").slice(0, 200));
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const generic = "Identifiants incorrects ou compte temporairement bloqué.";

  // Limite par adresse IP : 10 tentatives toutes les 15 minutes.
  if (!(await rateLimit("admin-login-ip", await currentIpHash(), 10, 900))) {
    return { error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const rows = await query<{ id: number; password_hash: string; locked_until: Date | null }>(
    `SELECT id, password_hash, locked_until FROM admins WHERE email = $1`,
    [email],
  );
  const admin = rows[0];
  const locked = Boolean(admin?.locked_until && new Date(admin.locked_until) > new Date());

  // Le mot de passe est toujours vérifié (même si le compte n'existe pas) pour ne pas révéler quels e-mails existent.
  const ok = await verifyPassword(password, admin?.password_hash ?? null);

  if (!admin || locked || !ok) {
    if (admin && !locked) {
      // Après 5 échecs consécutifs, le compte est bloqué 15 minutes.
      await query(
        `UPDATE admins SET
           locked_until = CASE WHEN failed_attempts + 1 >= $2 THEN now() + make_interval(mins => $3::int) ELSE locked_until END,
           failed_attempts = CASE WHEN failed_attempts + 1 >= $2 THEN 0 ELSE failed_attempts + 1 END
         WHERE id = $1`,
        [admin.id, MAX_ATTEMPTS, LOCK_MINUTES],
      );
    }
    await audit(admin?.id ?? null, "login_failed");
    return { error: generic };
  }

  await query(`UPDATE admins SET failed_attempts = 0, locked_until = NULL, last_login_at = now() WHERE id = $1`, [admin.id]);
  await createSession(admin.id);
  await audit(admin.id, "login");
  redirect("/admin");
}
