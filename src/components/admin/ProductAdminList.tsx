"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { setProductFlag } from "@/app/admin/actions";
import type { AdminProduct } from "@/lib/admin-products";
import { formatUSD } from "@/lib/format";

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[13px]">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="relative h-6 w-10 shrink-0 rounded-full bg-[#C3D6CD] transition-colors peer-checked:bg-leaf peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-leaf after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
      {label}
    </label>
  );
}

export function ProductAdminList({ products }: { products: AdminProduct[] }) {
  const [items, setItems] = useState(products);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function update(id: string, flag: "in_stock" | "is_active", value: boolean) {
    const before = items;
    setItems((list) => list.map((p) => (p.id === id ? { ...p, [flag]: value } : p)));
    setError(null);
    startTransition(async () => {
      const res = await setProductFlag(id, flag, value);
      if (!res.ok) {
        setItems(before);
        setError(res.error);
      }
    });
  }

  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((p) => `${p.name_km} ${p.name_en}`.toLowerCase().includes(q)) : items;

  return (
    <>
      <label className="mb-3 block">
        <span className="sr-only">ស្វែងរក</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ស្វែងរកផលិតផល..."
          className="h-12 w-full rounded-2xl border-[1.5px] border-[#C3D6CD] bg-white px-4 text-base focus:border-leaf focus:outline-none"
        />
      </label>
      {error && <p role="alert" className="mb-3 rounded-xl bg-[#FBE4E1] p-3 text-sm text-[#7A1D14]">{error}</p>}

      <ul className="flex flex-col gap-2.5">
        {shown.map((p) => (
          <li key={p.id} className={`rounded-2xl bg-white p-3 ${p.is_active ? "" : "opacity-70"}`}>
            <Link href={`/admin/products/${p.id}`} className="flex gap-3">
              <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ backgroundColor: p.tint }}>
                {p.imageUrl ? <Image src={p.imageUrl} alt="" fill sizes="64px" className="object-cover" /> : <span className="text-xs text-muted">គ្មានរូប</span>}
              </span>
              <span className="flex min-w-0 flex-1 flex-col justify-center">
                <span className="truncate font-semibold">{p.name_km}</span>
                <span className="truncate text-xs text-muted">{p.name_en}</span>
                <span className="text-sm font-semibold">{formatUSD(p.price)}</span>
              </span>
              <span className="self-center text-sm text-leaf">កែ ›</span>
            </Link>
            <div className="mt-1 flex flex-wrap gap-x-5 border-t border-line pt-1">
              <Toggle label="មានស្តុក" checked={p.in_stock} onChange={(v) => update(p.id, "in_stock", v)} />
              <Toggle label="បង្ហាញលើហាង" checked={p.is_active} onChange={(v) => update(p.id, "is_active", v)} />
            </div>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="py-12 text-center text-muted">រកមិនឃើញផលិតផលទេ</p>}
    </>
  );
}
