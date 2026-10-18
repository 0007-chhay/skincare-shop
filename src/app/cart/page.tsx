"use client";

import Image from "next/image";
import Link from "next/link";
import { BottleArt } from "@/components/BottleArt";
import { BackIcon, TrashIcon } from "@/components/icons";
import { useCart } from "@/lib/cart";
import { formatUSD, toKhmerNumber } from "@/lib/format";

export default function CartPage() {
  const { items, count, subtotal, setQty, remove } = useCart();

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="flex items-center gap-2 px-4 py-3">
        <Link href="/" aria-label="ត្រឡប់ក្រោយ" className="grid size-11 place-items-center">
          <BackIcon className="size-6" />
        </Link>
        <h1 className="font-display text-[22px] font-bold">កន្ត្រករបស់អ្នក</h1>
      </header>

      <main className="flex flex-1 flex-col gap-3 px-4 pb-32">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-muted">កន្ត្រករបស់អ្នកនៅទទេ។</p>
            <Link href="/" className="rounded-2xl bg-leaf px-6 py-3 font-semibold text-white">
              មើលផលិតផល
            </Link>
          </div>
        ) : (
          items.map(({ slug, qty, product }) => (
            <article key={slug} className="flex gap-3 rounded-[20px] bg-white p-3">
              <div className="relative grid size-[88px] shrink-0 place-items-center overflow-hidden rounded-2xl" style={{ backgroundColor: product.tint }}>
                {product.image ? (
                  <Image src={product.image} alt={product.nameKm} fill sizes="88px" className="object-cover" />
                ) : (
                  <BottleArt tint={product.tint} className="h-[66px]" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link href={`/p/${slug}`} className="text-[15px] font-semibold leading-normal">{product.nameKm}</Link>
                    <p className="text-xs text-muted">{product.nameEn}</p>
                  </div>
                  <button onClick={() => remove(slug)} aria-label={`លុប ${product.nameKm}`} className="-mr-2 -mt-2 grid size-11 place-items-center text-muted">
                    <TrashIcon className="size-[18px]" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{formatUSD(product.price * qty)}</span>
                  <div className="flex items-center rounded-xl bg-mint">
                    <button onClick={() => setQty(slug, qty - 1)} aria-label="បន្ថយ" className="h-10 w-11 text-lg">−</button>
                    <span className="w-5 text-center font-semibold">{qty}</span>
                    <button onClick={() => setQty(slug, qty + 1)} aria-label="បន្ថែម" className="h-10 w-11 text-lg">+</button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </main>

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 bg-ink pb-[max(env(safe-area-inset-bottom),16px)] text-white">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 pt-3">
            <div>
              <p className="text-[13px] text-[#B5CEC4]">សរុប · {toKhmerNumber(count)} មុខ · ដឹកឥតគិតថ្លៃ</p>
              <p className="text-lg font-semibold">{formatUSD(subtotal)}</p>
            </div>
            <Link href="/checkout" className="flex h-[50px] items-center rounded-2xl bg-white px-6 font-semibold text-ink">
              បន្តទៅមុខ
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
