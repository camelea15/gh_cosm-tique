"use server";

import { redirect } from "next/navigation";
import { audit, destroySession, requireAdmin } from "@/lib/auth";

export async function logoutAction() {
  const admin = await requireAdmin();
  await audit(admin.id, "logout");
  await destroySession();
  redirect("/admin/login");
}
