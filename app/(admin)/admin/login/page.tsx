import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connexion" };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="GH Cosmétique" width={96} height={96} priority className="h-24 w-24" />
          <h1 className="font-display mt-5 text-3xl font-semibold text-ink">Espace administration</h1>
          <p className="mt-1 text-sm text-muted">Réservé à la gestion de la boutique.</p>
        </div>
        <div className="card p-6 sm:p-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
