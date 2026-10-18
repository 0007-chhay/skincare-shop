"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatUSD } from "@/lib/format";
import type { Product } from "@/lib/products";
import { telegramLink } from "@/lib/site";
import { BottleArt } from "./BottleArt";
import { TelegramIcon } from "./icons";

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add(product.slug);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-white">
      <div className="relative grid h-[300px] place-items-center" style={{ backgroundColor: product.tint }}>
        {product.tag && (
          <span className="absolute left-3.5 top-3.5 z-10 rounded-full bg-white px-3 py-1 text-[13px]">
            {product.tag}
          </span>
        )}
        {product.image ? (
          <Image
            src={product.image}
            alt={product.nameKm}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <BottleArt tint={product.tint} className="h-[200px]" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[19px] font-bold leading-normal">{product.nameKm}</h2>
            <p className="text-[13px] text-muted">{product.nameEn}</p>
          </div>
          <p className="whitespace-nowrap text-lg font-semibold">{formatUSD(product.price)}</p>
        </div>
        <p className="text-sm leading-7 text-muted">{product.description}</p>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <button
            onClick={handleAdd}
            className="h-12 rounded-2xl bg-leaf text-[15px] font-semibold text-white transition-colors active:bg-ink"
          >
            {added ? "បានដាក់ ✓" : "ដាក់ចូលកន្ត្រក"}
          </button>
          <a
            href={telegramLink(`សួស្តី! ខ្ញុំចង់សួរអំពី ${product.nameKm} (${product.nameEn})`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-ink text-[15px]"
          >
            <TelegramIcon className="size-4" />
            សួរ Telegram
          </a>
        </div>
      </div>
    </article>
  );
}
