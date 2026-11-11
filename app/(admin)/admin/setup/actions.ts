"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, createSession, currentIpHash, hashPassword, passwordProblem } from "@/lib/auth";
import { query } from "@/lib/db";
import { rateLimit } from "@/lib/security";

export type FormState = { error?: string } | undefined;

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function setupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await rateLimit("admin-setup-ip", await currentIpHash(), 8, 900))) {
    return { error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const expected = process.env.ADMIN_SETUP_TOKEN ?? "";
  if (expected.length < 16) {
    return { error: "ADMIN_SETUP_TOKEN n'est pas configuré (16 caractères minimum) dans les variables d'environnement." };
  }

  const token = String(formData.get("token") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!safeEqual(token, expected)) return { error: "Jeton de configuration incorrect." };
  if (!z.string().email().max(200).safeParse(email).success) return { error: "Adresse e-mail invalide." };
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  if (password !== confirm) return { error: "Les deux mots de passe ne correspondent pas." };

  // Un seul compte peut être créé par cette page : l'insertion ne réussit que si la table est vide.
  const rows = await query<{ id: number }>(
    `INSERT INTO admins (email, password_hash)
     SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM admins)
     RETURNING id`,
    [email, await hashPassword(password)],
  );
  if (!rows[0]) return { error: "Un compte administrateur existe déjà." };

  await createSession(rows[0].id);
  await audit(rows[0].id, "setup_admin");
  redirect("/admin");
}
