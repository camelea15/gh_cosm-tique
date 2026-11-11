import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { clientIpFrom, hashValue, randomToken, sha256 } from "@/lib/security";

export const SESSION_COOKIE = "gh_admin";
const IDLE_MINUTES = 30; // déconnexion automatique après 30 min d'inactivité
const ABSOLUTE_HOURS = 8; // durée maximale d'une session

// Hachage factice : permet de faire le même travail même si l'e-mail n'existe pas (évite de révéler quels comptes existent).
const DUMMY_HASH = "$2b$12$Yi6.eOXsi2I.udomdOnziuIa/5Uo8p5ajQy7ZXqzuiR8jswLDFgo6";

export type AdminUser = { id: number; email: string };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  return bcrypt.compare(password, hash ?? DUMMY_HASH).then((ok) => ok && hash !== null);
}

/** Mot de passe fort : 12 caractères minimum, avec lettres et chiffres (72 octets max, limite de bcrypt). */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 12) return "Le mot de passe doit contenir au moins 12 caractères.";
  if (Buffer.byteLength(pw, "utf8") > 72) return "Le mot de passe est trop long (72 octets maximum).";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Le mot de passe doit contenir des lettres et des chiffres.";
  return null;
}

export async function currentIpHash(): Promise<string> {
  return hashValue(clientIpFrom(await headers()));
}

export async function createSession(adminId: number): Promise<void> {
  const token = randomToken(32);
  await query(
    `INSERT INTO admin_sessions (token_hash, admin_id, expires_at)
     VALUES ($1, $2, now() + make_interval(hours => $3::int))`,
    [sha256(token), adminId, ABSOLUTE_HOURS],
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: ABSOLUTE_HOURS * 3600,
  });
  // Nettoyage des sessions expirées.
  await query(`DELETE FROM admin_sessions WHERE expires_at < now()`);
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await query(`DELETE FROM admin_sessions WHERE token_hash = $1`, [sha256(token)]);
  jar.delete({ name: SESSION_COOKIE, path: "/admin" });
}

/** Retourne l'administrateur connecté (session valide et active) ou null. */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const tokenHash = sha256(token);
  const rows = await query<{ id: number; email: string; last_seen_at: Date }>(
    `SELECT a.id, a.email, s.last_seen_at
     FROM admin_sessions s JOIN admins a ON a.id = s.admin_id
     WHERE s.token_hash = $1 AND s.expires_at > now()
       AND s.last_seen_at > now() - make_interval(mins => $2::int)`,
    [tokenHash, IDLE_MINUTES],
  );
  const row = rows[0];
  if (!row) return null;
  if (Date.now() - new Date(row.last_seen_at).getTime() > 60_000) {
    await query(`UPDATE admin_sessions SET last_seen_at = now() WHERE token_hash = $1`, [tokenHash]);
  }
  return { id: row.id, email: row.email };
});

/** À appeler au début de CHAQUE page et action du dashboard : sans session valide, redirection vers la connexion. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function audit(adminId: number | null, action: string, detail?: string): Promise<void> {
  try {
    await query(`INSERT INTO audit_log (admin_id, action, detail, ip_hash) VALUES ($1, $2, $3, $4)`, [
      adminId,
      action,
      detail ?? null,
      await currentIpHash(),
    ]);
  } catch (err) {
    console.error("audit failed", (err as Error).message);
  }
}
