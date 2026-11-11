"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { formatDA } from "@/lib/format";
import { whatsappLink } from "@/lib/site";
import type { Dict, Locale } from "@/lib/i18n";

export function ConfirmationView({ orderNumber, locale, t }: { orderNumber: string; locale: Locale; t: Dict }) {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("gh_last_order");
      if (!raw) return;
      const data = JSON.parse(raw) as { n?: string; total?: number };
      if (data.n === orderNumber && typeof data.total === "number" && data.total > 0) setTotal(data.total);
    } catch {
      /* ignoré */
    }
  }, [orderNumber]);

  return (
    <div className="card mx-auto max-w-xl px-6 py-12 text-center sm:px-10">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white shadow-lift">
        <Icon name="check" size={32} strokeWidth={2.4} />
      </span>
      <h1 className="font-display mt-6 text-3xl font-semibold text-ink">{t.confirmation.title}</h1>
      <p className="mt-3 text-muted">{t.confirmation.text}</p>

      <dl className="mt-8 space-y-4 rounded-2xl bg-brand-50 p-6">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-brand-700">{t.confirmation.number}</dt>
          <dd className="mt-1 text-2xl font-bold tracking-wider text-brand-800" dir="ltr">
            {orderNumber}
          </dd>
        </div>
        {total !== null && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-brand-700">{t.confirmation.total}</dt>
            <dd className="mt-1 text-xl font-bold text-ink">{formatDA(total, locale)}</dd>
          </div>
        )}
      </dl>
      <p className="mt-4 text-sm text-muted">{t.confirmation.keep}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href={`/${locale}`} className="btn btn-primary">
          {t.confirmation.back}
        </Link>
        <a
          href={whatsappLink(`${orderNumber}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          <Icon name="whatsapp" size={18} />
          {t.confirmation.whatsapp}
        </a>
      </div>
    </div>
  );
}
