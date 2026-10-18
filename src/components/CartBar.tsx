"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatUSD, toKhmerNumber } from "@/lib/format";

// របារកន្ត្រកនៅខាងក្រោម — បង្ហាញតែពេលមានទំនិញក្នុងកន្ត្រក
export function CartBar() {
  const { count, subtotal } = useCart();
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-ink pb-[max(env(safe-area-inset-bottom),16px)] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-3">
        <div>
          <p className="text-[13px] text-[#B5CEC4]">កន្ត្រក · {toKhmerNumber(count)} មុខ</p>
          <p className="text-lg font-semibold">{formatUSD(subtotal)}</p>
        </div>
        <Link href="/cart" className="flex h-[50px] items-center rounded-2xl bg-white px-6 text-base font-semibold text-ink">
          បញ្ជាទិញ
        </Link>
      </div>
    </div>
  );
}
