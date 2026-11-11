import Image from "next/image";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Première configuration" };

export default async function SetupPage() {
  // Cette page n'existe plus dès qu'un compte administrateur a été créé.
  const rows = await query<{ n: number }>(`SELECT count(*)::int AS n FROM admins`);
  if ((rows[0]?.n ?? 0) > 0) notFound();
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="GH Cosmétique" width={96} height={96} priority className="h-24 w-24" />
          <h1 className="font-display mt-5 text-3xl font-semibold text-ink">Première configuration</h1>
          <p className="mt-1 text-sm text-muted">Créez le compte administrateur de la boutique.</p>
        </div>
        <div className="card p-6 sm:p-8">
          <SetupForm />
        </div>
      </div>
    </main>
  );
}
