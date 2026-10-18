"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";

export function AddToCartBar({ slug, inStock }: { slug: string; inStock: boolean }) {
  const { add, count } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add(slug, qty);
    setAdded(true);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[max(env(safe-area-inset-bottom),16px)]">
      <div className="mx-auto flex max-w-xl items-center gap-2.5 px-4 pt-3">
        {!inStock ? (
          <button disabled className="h-[50px] flex-1 rounded-2xl bg-line font-semibold text-muted">
            អស់ស្តុក
          </button>
        ) : added ? (
          <>
            <button
              onClick={() => setAdded(false)}
              className="h-[50px] rounded-2xl border-[1.5px] border-ink px-4 text-[15px]"
            >
              ទិញបន្ថែម
            </button>
            <Link
              href="/cart"
              className="flex h-[50px] flex-1 items-center justify-center rounded-2xl bg-leaf text-base font-semibold text-white"
            >
              មើលកន្ត្រក ({count})
            </Link>
          </>
        ) : (
          <>
            <div className="flex h-[50px] items-center rounded-2xl border-[1.5px] border-ink">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="បន្ថយ" className="h-full w-11 text-xl">
                −
              </button>
              <span className="w-6 text-center font-semibold" aria-live="polite">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="បន្ថែម" className="h-full w-11 text-xl">
                +
              </button>
            </div>
            <button onClick={handleAdd} className="h-[50px] flex-1 rounded-2xl bg-leaf text-base font-semibold text-white">
              ដាក់ចូលកន្ត្រក
            </button>
          </>
        )}
      </div>
    </div>
  );
}
