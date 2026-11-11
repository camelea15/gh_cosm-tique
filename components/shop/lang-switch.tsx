"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n";

export function LangSwitch({ locale, label, className }: { locale: Locale; label: string; className?: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const target: Locale = locale === "fr" ? "ar" : "fr";
  const rest = pathname.replace(/^\/(fr|ar)(?=\/|$)/, "");
  const href = `/${target}${rest}${search ? `?${search}` : ""}`;
  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      className={
        className ??
        "inline-flex min-h-9 items-center rounded-full border border-brand-200 px-3.5 text-sm font-semibold text-brand-700 transition hover:border-brand-500 hover:bg-brand-50"
      }
    >
      {label}
    </Link>
  );
}
