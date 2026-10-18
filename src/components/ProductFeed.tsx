"use client";

import { useState } from "react";
import { concerns, type Concern, type Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";

export function ProductFeed({ products }: { products: Product[] }) {
  const [active, setActive] = useState<Concern | "all">("all");
  const shown = active === "all" ? products : products.filter((p) => p.concerns.includes(active));

  return (
    <>
      <nav aria-label="តម្រងតាមបញ្ហាស្បែក" className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3.5 pt-1">
        {concerns.map((c) => {
          const selected = c.id === active;
          return (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              aria-pressed={selected}
              className={`h-10 shrink-0 rounded-full px-4 text-sm ${selected ? "bg-ink text-white" : "bg-white text-ink"}`}
            >
              {c.label}
            </button>
          );
        })}
      </nav>

      <div className="grid gap-4 px-3 pb-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p, i) => (
          <ProductCard key={p.slug} product={p} priority={i < 2} />
        ))}
        {shown.length === 0 && (
          <p className="col-span-full py-16 text-center text-muted">មិនទាន់មានផលិតផលសម្រាប់ប្រភេទនេះទេ។ សូមសួរយើងតាម Telegram។</p>
        )}
      </div>
    </>
  );
}
