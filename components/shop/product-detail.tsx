"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { PriceTypeToggle } from "@/components/shop/price-type-toggle";
import { useCart, type PriceType } from "@/components/shop/cart-provider";
import { formatDA } from "@/lib/format";
import type { Dict, Locale } from "@/lib/i18n";

export function ProductPurchase({
  productId,
  priceRetail,
  priceWholesale,
  outOfStock,
  locale,
  t,
}: {
  productId: number;
  priceRetail: number;
  priceWholesale: number;
  outOfStock: boolean;
  locale: Locale;
  t: Dict;
}) {
  const { add } = useCart();
  const [priceType, setPriceType] = useState<PriceType>("detail");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const unit = priceType === "gros" ? priceWholesale : priceRetail;

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="label">{t.products.buyAs}</legend>
        <PriceTypeToggle
          value={priceType}
          onChange={(v) => {
            setPriceType(v);
            setAdded(false);
          }}
          options={[
            { value: "detail", label: t.products.priceTypeDetail, price: formatDA(priceRetail, locale) },
            { value: "gros", label: t.products.priceTypeGros, price: formatDA(priceWholesale, locale) },
          ]}
        />
      </fieldset>

      <div>
        <span className="label">{t.products.quantity}</span>
        <div className="inline-flex items-center rounded-full border border-line bg-white">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-brand-700 hover:bg-brand-50"
            aria-label={t.cart.decrease}
          >
            <Icon name="minus" size={18} />
          </button>
          <span className="w-10 text-center text-base font-semibold tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-brand-700 hover:bg-brand-50"
            aria-label={t.cart.increase}
          >
            <Icon name="plus" size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={outOfStock}
          onClick={() => {
            add(productId, priceType, qty);
            setAdded(true);
          }}
          className="btn btn-primary min-h-12 flex-1 text-base sm:flex-none sm:px-10"
        >
          <Icon name="cart" size={20} />
          {outOfStock ? t.products.outOfStock : `${t.products.add} · ${formatDA(unit * qty, locale)}`}
        </button>
        <div role="status" aria-live="polite">
          {added && (
            <Link
              href={`/${locale}/panier`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              <Icon name="check" size={18} />
              {t.products.added} · {t.products.goCart}
              <Icon name="arrow" size={16} className="rtl:-scale-x-100" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
