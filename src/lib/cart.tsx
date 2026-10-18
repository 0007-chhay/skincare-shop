"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { getProduct, type Product } from "./products";

type CartLine = { slug: string; qty: number };
type Action =
  | { type: "add"; slug: string; qty?: number }
  | { type: "setQty"; slug: string; qty: number }
  | { type: "remove"; slug: string }
  | { type: "load"; lines: CartLine[] }
  | { type: "clear" };

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case "load":
      return action.lines;
    case "add": {
      const qty = action.qty ?? 1;
      const found = state.find((l) => l.slug === action.slug);
      if (found) return state.map((l) => (l.slug === action.slug ? { ...l, qty: l.qty + qty } : l));
      return [...state, { slug: action.slug, qty }];
    }
    case "setQty":
      if (action.qty <= 0) return state.filter((l) => l.slug !== action.slug);
      return state.map((l) => (l.slug === action.slug ? { ...l, qty: action.qty } : l));
    case "remove":
      return state.filter((l) => l.slug !== action.slug);
    case "clear":
      return [];
  }
}

type CartContextValue = {
  items: (CartLine & { product: Product })[];
  count: number;
  subtotal: number;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, []);

  // ទាញកន្ត្រកដែលបានរក្សាទុកពីមុន
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) dispatch({ type: "load", lines: JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines]);

  const value = useMemo<CartContextValue>(() => {
    const items = lines
      .map((l) => ({ ...l, product: getProduct(l.slug) }))
      .filter((l): l is CartLine & { product: Product } => Boolean(l.product));
    return {
      items,
      count: items.reduce((n, l) => n + l.qty, 0),
      subtotal: items.reduce((s, l) => s + l.qty * l.product.price, 0),
      add: (slug, qty) => dispatch({ type: "add", slug, qty }),
      setQty: (slug, qty) => dispatch({ type: "setQty", slug, qty }),
      remove: (slug) => dispatch({ type: "remove", slug }),
      clear: () => dispatch({ type: "clear" }),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
