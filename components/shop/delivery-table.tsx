"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { formatDA } from "@/lib/format";
import { wilayaName } from "@/lib/localize";
import type { Wilaya } from "@/lib/data";
import type { Dict, Locale } from "@/lib/i18n";

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function DeliveryTable({ wilayas, locale, t }: { wilayas: Wilaya[]; locale: Locale; t: Dict }) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = norm(q.trim());
    if (!needle) return wilayas;
    return wilayas.filter((w) => norm(`${w.name_fr} ${w.name_ar} ${w.code}`).includes(needle));
  }, [q, wilayas]);

  return (
    <div>
      <label className="relative block max-w-sm">
        <span className="sr-only">{t.delivery.search}</span>
        <Icon name="search" size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.delivery.search}
          className="field ps-11"
          autoComplete="off"
        />
      </label>
      <div className="card mt-5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-start text-xs uppercase tracking-wider text-brand-800">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-semibold sm:px-6">
                {t.delivery.wilaya}
              </th>
              <th scope="col" className="px-4 py-3 text-end font-semibold sm:px-6">
                {t.delivery.stopdesk}
              </th>
              <th scope="col" className="px-4 py-3 text-end font-semibold sm:px-6">
                {t.delivery.homeCol}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((w) => (
              <tr key={w.code} className="hover:bg-brand-50/40">
                <th scope="row" className="px-4 py-3 text-start font-medium sm:px-6">
                  <span className="me-2 text-xs tabular-nums text-muted">{String(w.code).padStart(2, "0")}</span>
                  {wilayaName(w, locale)}
                </th>
                <td className="px-4 py-3 text-end font-semibold tabular-nums text-brand-700 sm:px-6">
                  {formatDA(w.fee_stopdesk, locale)}
                </td>
                <td className="px-4 py-3 text-end font-semibold tabular-nums text-brand-700 sm:px-6">
                  {formatDA(w.fee_home, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-8 text-center text-muted">{t.products.noResults}</p>}
      </div>
    </div>
  );
}
