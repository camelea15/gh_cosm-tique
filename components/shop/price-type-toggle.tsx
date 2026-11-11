"use client";

import type { PriceType } from "@/components/shop/cart-provider";

export function PriceTypeToggle({
  value,
  onChange,
  options,
  compact,
}: {
  value: PriceType;
  onChange: (v: PriceType) => void;
  options: { value: PriceType; label: string; price?: string }[];
  compact?: boolean;
}) {
  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`} role="radiogroup">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex items-center justify-between gap-3 rounded-xl border text-start transition ${
              compact ? "min-h-10 px-3 text-sm" : "min-h-14 px-4"
            } ${
              active
                ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                : "border-line bg-white hover:border-brand-300"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span
                className={`flex h-4.5 w-4.5 items-center justify-center rounded-full border ${
                  active ? "border-brand-600" : "border-brand-300"
                }`}
                style={{ width: 18, height: 18 }}
              >
                {active && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
              </span>
              <span className="font-medium text-ink">{o.label}</span>
            </span>
            {o.price && <span className="font-bold text-brand-700">{o.price}</span>}
          </button>
        );
      })}
    </div>
  );
}
