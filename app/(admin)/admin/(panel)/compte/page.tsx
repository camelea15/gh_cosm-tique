import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDateTime } from "@/lib/admin-format";
import { logoutEverywhereAction } from "./actions";
import { PasswordForm } from "./password-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compte et sécurité" };

const ACTION_LABEL: Record<string, string> = {
  login: "Connexion",
  login_failed: "Échec de connexion",
  logout: "Déconnexion",
  logout_all: "Déconnexion de toutes les sessions",
  setup_admin: "Création du compte administrateur",
  password_change: "Changement de mot de passe",
  order_status: "Changement de statut de commande",
  order_note: "Note sur une commande",
  product_create: "Produit créé",
  product_update: "Produit modifié",
  product_show: "Produit affiché",
  product_hide: "Produit masqué",
  fees_update: "Tarifs de livraison modifiés",
  export_csv: "Export CSV des commandes",
};

export default async function AccountPage() {
  const admin = await requireAdmin();
  const log = await query<{ action: string; detail: string | null; created_at: Date }>(
    `SELECT action, detail, created_at FROM audit_log ORDER BY created_at DESC LIMIT 25`,
  );
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Compte et sécurité</h1>
      <p className="mt-1 text-sm text-muted">Connecté en tant que {admin.email}</p>

      <section className="card mt-6 p-6 sm:p-8">
        <h2 className="font-semibold">Changer le mot de passe</h2>
        <div className="mt-5">
          <PasswordForm />
        </div>
      </section>

      <section className="card mt-6 p-6 sm:p-8">
        <h2 className="font-semibold">Sessions</h2>
        <p className="mt-1 text-sm text-muted">
          Vous êtes déconnectée automatiquement après 30 minutes d&apos;inactivité. Si vous pensez que quelqu&apos;un d&apos;autre a accès à votre compte, fermez toutes les sessions.
        </p>
        <form action={logoutEverywhereAction} className="mt-4">
          <button type="submit" className="btn btn-outline min-h-11">
            Fermer toutes les sessions
          </button>
        </form>
      </section>

      <section className="card mt-6 p-6 sm:p-8">
        <h2 className="font-semibold">Journal d&apos;activité</h2>
        <ul className="mt-4 divide-y divide-line text-sm">
          {log.map((l, i) => (
            <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
              <span>
                <span className="font-medium">{ACTION_LABEL[l.action] ?? l.action}</span>
                {l.detail && <span className="text-muted"> · {l.detail}</span>}
              </span>
              <time className="text-xs text-muted">{formatDateTime(l.created_at)}</time>
            </li>
          ))}
          {log.length === 0 && <li className="py-4 text-muted">Aucune activité enregistrée.</li>}
        </ul>
      </section>
    </div>
  );
}
