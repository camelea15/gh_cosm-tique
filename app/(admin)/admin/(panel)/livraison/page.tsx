import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { FeesForm } from "./fees-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tarifs de livraison" };

export default async function DeliveryAdminPage() {
  await requireAdmin();
  const wilayas = await query<{ code: number; name_fr: string; fee_stopdesk: number; fee_home: number }>(
    `SELECT code, name_fr, fee_stopdesk, fee_home FROM wilayas ORDER BY code`,
  );
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Tarifs de livraison</h1>
      <p className="mt-1 text-sm text-muted">
        Modifiez les tarifs par wilaya. Ils s&apos;appliquent immédiatement aux nouvelles commandes ; les commandes déjà reçues gardent leur tarif.
      </p>
      <div className="mt-6">
        <FeesForm wilayas={wilayas} />
      </div>
    </div>
  );
}
