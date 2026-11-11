import { NextResponse } from "next/server";
import { audit, getAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { csvCell, isStatus } from "@/lib/admin-format";

export const dynamic = "force-dynamic";

// Export CSV des commandes. Accessible uniquement avec une session administrateur valide.
export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const status = new URL(req.url).searchParams.get("status");
  const params: unknown[] = [];
  let where = "";
  if (isStatus(status)) {
    params.push(status);
    where = "WHERE o.status = $1";
  }

  const rows = await query<Record<string, unknown>>(
    `SELECT o.order_number, o.created_at, o.status, o.customer_name, o.phone, w.name_fr AS wilaya, o.commune, o.address,
            o.delivery_type, o.subtotal, o.delivery_fee, o.total, o.has_wholesale, o.customer_note,
            (SELECT string_agg(oi.product_name || ' x' || oi.quantity || ' (' || oi.price_type || ')', ' | ' ORDER BY oi.id)
               FROM order_items oi WHERE oi.order_id = o.id) AS produits
     FROM orders o JOIN wilayas w ON w.code = o.wilaya_code
     ${where}
     ORDER BY o.created_at DESC
     LIMIT 5000`,
    params,
  );

  const header = [
    "Numero", "Date", "Statut", "Client", "Telephone", "Wilaya", "Commune", "Adresse", "Livraison",
    "Sous-total", "Frais livraison", "Total", "Prix de gros", "Note client", "Produits",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.order_number, new Date(r.created_at as string).toISOString(), r.status, r.customer_name, r.phone, r.wilaya,
        r.commune, r.address, r.delivery_type, r.subtotal, r.delivery_fee, r.total, r.has_wholesale ? "oui" : "non",
        r.customer_note, r.produits,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  await audit(admin.id, "export_csv", `${rows.length} commandes`);

  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="commandes-gh-cosmetique-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
