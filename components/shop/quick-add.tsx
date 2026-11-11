"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useCart } from "@/components/shop/cart-provider";

export function QuickAdd({
  productId,
  label,
  addedLabel,
  disabled,
}: {
  productId: number;
  label: string;
  addedLabel: string;
  disabled?: boolean;
}) {
  const { add } = useCart();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1800);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        add(productId, "detail", 1);
        setDone(true);
      }}
      className="btn btn-outline min-h-10 w-full px-4 text-[13px]"
      aria-live="polite"
    >
      <Icon name={done ? "check" : "plus"} size={16} />
      {done ? addedLabel : label}
    </button>
  );
}
