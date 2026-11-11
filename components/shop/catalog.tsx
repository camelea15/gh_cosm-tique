"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { ProductCard } from "@/components/shop/product-card";
import { fill, type Dict, type Locale } from "@/lib/i18n";
import { categoryName } from "@/lib/localize";
import type { Category, Product } from "@/lib/data";

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function Catalog({
  products,
  categories,
  locale,
  t,
  activeCategory,
}: {
  products: Product[];
  categories: Category[];
  locale: Locale;
  t: Dict;
  activeCategory: string | null;
}) {
  const [q, setQ] = useState("");
  const catById = useMemo(() => new Map(categories.map((c) => [c.slug, c])), [categories]);

  const filtered = useMemo(() => {
    const needle = norm(q.trim());
    return products.filter((p) => {
      if (activeCategory && p.category_slug !== activeCategory) return false;
      if (!needle) return true;
      return norm(`${p.name_fr} ${p.name_ar ?? ""}`).includes(needle);
    });
  }, [products, q, activeCategory]);

  const base = `/${locale}/produits`;
  const chip = (active: boolean) =>
    `inline-flex min-h-10 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition ${
      active
        ? "border-brand-600 bg-brand-600 text-white shadow-soft"
        : "border-line bg-white text-ink/80 hover:border-brand-300 hover:bg-brand-50"
    }`;

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="list">
          <Link href={base} className={chip(!activeCategory)} role="listitem" aria-current={!activeCategory ? "page" : undefined}>
            {t.products.all}
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`${base}?cat=${c.slug}`}
              className={chip(activeCategory === c.slug)}
              role="listitem"
              aria-current={activeCategory === c.slug ? "page" : undefined}
            >
              {categoryName(c, locale)}
            </Link>
          ))}
        </div>
        <label className="relative block w-full lg:w-80">
          <span className="sr-only">{t.products.searchPlaceholder}</span>
          <Icon name="search" size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.products.searchPlaceholder}
            className="field ps-11"
            autoComplete="off"
          />
        </label>
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {fill(t.products.resultCount, { n: filtered.length })}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-10 text-center text-muted">
          {t.products.noResults}
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {filtered.map((p, i) => {
            const cat = p.category_slug ? catById.get(p.category_slug) : undefined;
            return (
              <li key={p.id}>
                <ProductCard
                  product={p}
                  locale={locale}
                  t={t}
                  categoryLabel={cat ? categoryName(cat, locale) : undefined}
                  priority={i < 4}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
