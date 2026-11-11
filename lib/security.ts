import { createHash, randomBytes } from "node:crypto";
import { query } from "@/lib/db";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET manquant ou trop court (variable d'environnement).");
    }
    return "dev-only-secret-not-for-production";
  }
  return s;
}

/** Empreinte irréversible (SHA-256 + secret) : on ne stocke jamais les adresses IP en clair. */
export function hashValue(value: string): string {
  return createHash("sha256").update(`${secret()}|${value}`).digest("hex");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function clientIpFrom(h: Headers): string {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim().slice(0, 64);
  return (h.get("x-real-ip") ?? "unknown").slice(0, 64);
}

/** Protection CSRF : la requête doit provenir du même site (en-tête Origin = hôte courant). */
export function isSameOrigin(h: Headers): boolean {
  const origin = h.get("origin");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Limitation de débit stockée en base (compatible avec un hébergement sans état).
 * Retourne false si la limite est atteinte ; sinon enregistre l'événement et retourne true.
 */
export async function rateLimit(bucket: string, key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const rows = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM rate_limit_events
     WHERE bucket = $1 AND key_hash = $2 AND created_at > now() - make_interval(secs => $3::int)`,
    [bucket, key, windowSeconds],
  );
  if ((rows[0]?.n ?? 0) >= limit) return false;
  await query(`INSERT INTO rate_limit_events (bucket, key_hash) VALUES ($1, $2)`, [bucket, key]);
  if (Math.random() < 0.02) {
    await query(`DELETE FROM rate_limit_events WHERE created_at < now() - interval '2 days'`);
  }
  return true;
}
