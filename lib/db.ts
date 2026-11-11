import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

type NeonSql = ReturnType<typeof neon>;
let neonSql: NeonSql | undefined;

// Base locale en mémoire (PGlite), utilisée UNIQUEMENT pour les tests en développement.
// Jamais active en production (NODE_ENV=production).
const g = globalThis as unknown as { __pglite?: Promise<{ query: (t: string, p?: unknown[]) => Promise<{ rows: Row[] }> }> };

function getPglite() {
  if (!g.__pglite) {
    g.__pglite = (async () => {
      const { PGlite } = await import("@electric-sql/pglite");
      const db = new PGlite();
      await db.exec(readFileSync(join(process.cwd(), "db/schema.sql"), "utf8"));
      await db.exec(readFileSync(join(process.cwd(), "db/seed.sql"), "utf8"));
      return db;
    })();
  }
  return g.__pglite;
}

/**
 * Exécute une requête SQL paramétrée ($1, $2...). Les valeurs ne sont JAMAIS concaténées
 * dans le texte SQL : c'est la protection contre les injections SQL.
 */
export async function query<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  if (process.env.DB_DRIVER === "pglite" && process.env.NODE_ENV !== "production") {
    const db = await getPglite();
    const res = await db.query(text, params);
    return res.rows as T[];
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL est manquant (variable d'environnement).");
  neonSql ??= neon(url);
  return (await neonSql.query(text, params)) as T[];
}
