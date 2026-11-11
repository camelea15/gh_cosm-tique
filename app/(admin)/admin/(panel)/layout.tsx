import Image from "next/image";
import { AdminNav } from "@/components/admin/nav";
import { Icon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const counts = await query<{ new_count: number }>(
    `SELECT count(*) FILTER (WHERE seen_at IS NULL AND status IN ('en_attente','a_verifier'))::int AS new_count FROM orders`,
  );
  const newCount = counts[0]?.new_count ?? 0;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-e">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:flex-col lg:items-stretch lg:gap-6 lg:p-5">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={44} height={44} className="h-11 w-11" />
            <div className="leading-tight">
              <p className="font-display text-lg font-semibold text-brand-700">GH Cosmétique</p>
              <p className="text-xs text-muted">Administration</p>
            </div>
          </div>
          <div className="lg:hidden">
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost min-h-10 px-3" aria-label="Se déconnecter">
                <Icon name="logout" size={18} />
              </button>
            </form>
          </div>
        </div>
        <div className="px-3 pb-3 lg:px-4">
          <AdminNav
            items={[
              { href: "/admin", label: "Commandes", icon: "bell", badge: newCount },
              { href: "/admin/produits", label: "Produits", icon: "box" },
              { href: "/admin/livraison", label: "Livraison", icon: "truck" },
              { href: "/admin/statistiques", label: "Statistiques", icon: "chart" },
              { href: "/admin/compte", label: "Compte et sécurité", icon: "shield" },
            ]}
          />
        </div>
        <div className="hidden border-t border-line p-4 lg:absolute lg:bottom-0 lg:block lg:w-full">
          <p className="truncate text-xs text-muted" title={admin.email}>
            {admin.email}
          </p>
          <form action={logoutAction} className="mt-2">
            <button type="submit" className="btn btn-outline min-h-10 w-full text-[13px]">
              <Icon name="logout" size={16} />
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">{children}</div>
    </div>
  );
}
