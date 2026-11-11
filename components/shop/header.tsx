"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { Icon } from "@/components/icons";
import { LangSwitch } from "@/components/shop/lang-switch";
import { useCart } from "@/components/shop/cart-provider";
import type { Dict, Locale } from "@/lib/i18n";

export function Header({ locale, t }: { locale: Locale; t: Dict }) {
  const [open, setOpen] = useState(false);
  const { count, ready } = useCart();
  const base = `/${locale}`;
  const links = [
    { href: base, label: t.nav.home },
    { href: `${base}/produits`, label: t.nav.products },
    { href: `${base}/livraison`, label: t.nav.delivery },
    { href: `${base}#contact`, label: t.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
        <Link href={base} className="flex items-center gap-3" aria-label="GH Cosmétique">
          <Image src="/logo.png" alt="" width={48} height={48} priority className="h-11 w-11 sm:h-12 sm:w-12" />
          <span className="font-display text-lg font-semibold tracking-tight text-brand-700 sm:text-xl">
            GH Cosmétique
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation principale">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-ink/80 transition hover:text-brand-600">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <LangSwitch locale={locale} label={t.common.switchTo} />
          </Suspense>
          <Link
            href={`${base}/panier`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-700 transition hover:bg-brand-50"
            aria-label={`${t.nav.cart}${ready && count > 0 ? ` (${count})` : ""}`}
          >
            <Icon name="cart" size={22} />
            {ready && count > 0 && (
              <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-700 transition hover:bg-brand-50 md:hidden"
            aria-label={open ? t.common.close : t.common.menu}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "x" : "menu"} size={22} />
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" className="border-t border-line bg-white md:hidden" aria-label="Menu mobile">
          <div className="container-page flex flex-col py-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-line/60 py-3.5 text-base font-medium text-ink last:border-0"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
