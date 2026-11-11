"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type PriceType = "detail" | "gros";
// Le panier ne garde QUE des identifiants, un tarif et une quantité. Les prix affichés viennent toujours du catalogue
// à jour, et le total réel est recalculé par le serveur au moment de la commande.
export type CartLine = { id: number; priceType: PriceType; qty: number };

type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  add: (id: number, priceType: PriceType, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  setPriceType: (id: number, priceType: PriceType) => void;
  remove: (id: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "gh_cart_v1";
const MAX_QTY = 20;

function sanitize(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const { id, priceType, qty } = r as Record<string, unknown>;
    if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) continue;
    if (priceType !== "detail" && priceType !== "gros") continue;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) continue;
    out.push({ id, priceType, qty: Math.min(qty, MAX_QTY) });
  }
  return out.slice(0, 30);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setLines(sanitize(JSON.parse(saved)));
    } catch {
      /* stockage indisponible : le panier reste en mémoire */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignoré */
    }
  }, [lines, ready]);

  const add = useCallback((id: number, priceType: PriceType, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === id);
      if (existing) {
        return prev.map((l) => (l.id === id ? { ...l, priceType, qty: Math.min(MAX_QTY, l.qty + qty) } : l));
      }
      return [...prev, { id, priceType, qty: Math.min(MAX_QTY, qty) }];
    });
  }, []);

  const setQty = useCallback((id: number, qty: number) => {
    setLines((prev) =>
      qty < 1 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
    );
  }, []);

  const setPriceType = useCallback((id: number, priceType: PriceType) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, priceType } : l)));
  }, []);

  const remove = useCallback((id: number) => setLines((prev) => prev.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((s, l) => s + l.qty, 0),
      add,
      setQty,
      setPriceType,
      remove,
      clear,
    }),
    [lines, ready, add, setQty, setPriceType, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return ctx;
}
