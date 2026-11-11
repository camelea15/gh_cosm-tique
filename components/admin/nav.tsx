"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";

type Item = { href: string; label: string; icon: "bell" | "box" | "truck" | "chart" | "shield"; badge?: number };

export function AdminNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation du dashboard" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((it) => {
        const active = it.href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/commandes") : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition ${
              active ? "bg-brand-600 text-white shadow-soft" : "text-ink/80 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            <Icon name={it.icon} size={18} />
            <span className="whitespace-nowrap">{it.label}</span>
            {it.badge !== undefined && it.badge > 0 && (
              <span
                className={`ms-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  active ? "bg-white text-brand-700" : "bg-brand-600 text-white"
                }`}
              >
                {it.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
