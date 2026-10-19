"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { adjustStock, setProductFlag, type AdjustReason } from "@/app/admin/actions";
import type { AdminProduct } from "@/lib/admin-products";
import { formatUSD } from "@/lib/format";
import { stockLevel, stockStyle, type StockLevel } from "@/lib/stock";
import { StockHistory } from "./StockHistory";

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[13px]">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative h-6 w-10 shrink-0 rounded-full bg-[#C3D6CD] transition-colors peer-checked:bg-leaf peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-leaf after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
      {label}
    </label>
  );
}

function StockBadge({ stock }: { stock: number | null }) {
  const level = stockLevel(stock);
  const s = stockStyle[level];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.badge}`}>
      <span className={`size-2 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}

// ស្តុក = លេខអានតែប៉ុណ្ណោះ (ស្តុកចូលថ្មី ត្រូវបញ្ចូលក្នុង Finance → ទិញចូល)
function StockNumber({ stock }: { stock: number | null }) {
  return (
    <span
      aria-label="ចំនួនក្នុងស្តុក"
      className="flex h-11 min-w-14 items-center justify-center rounded-xl bg-[#F4F7F5] px-3 text-base font-bold"
    >
      {stock === null ? "—" : stock}
    </span>
  );
}

const adjustOptions: { id: AdjustReason; label: string; mode: "remove" | "set" }[] = [
  { id: "damaged", label: "ខូច", mode: "remove" },
  { id: "lost", label: "បាត់", mode: "remove" },
  { id: "count", label: "រាប់ស្តុកកែ", mode: "set" },
];

// ផ្ទាំងកែតម្រូវស្តុក: ជ្រើសមូលហេតុ → ដាក់ចំនួន → ឃើញលទ្ធផលមុនរក្សាទុក
function StockAdjustPanel({
  id,
  stock,
  onDone,
  onCancel,
}: {
  id: string;
  stock: number;
  onDone: (stock: number) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState<AdjustReason | null>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const opt = adjustOptions.find((o) => o.id === reason);
  const n = amount === "" ? null : Number(amount);
  const next = opt && n !== null ? (opt.mode === "set" ? n : stock - n) : null;
  const valid =
    opt !== undefined &&
    n !== null &&
    next !== null &&
    next >= 0 &&
    next !== stock &&
    (opt.mode === "set" || n >= 1);
  const diff = next === null ? 0 : next - stock;

  function save() {
    if (!reason || n === null || !valid) return;
    setError(null);
    startTransition(async () => {
      const res = await adjustStock(id, reason, n);
      if (res.ok) onDone(res.data.stock);
      else setError(res.error);
    });
  }

  return (
    <div className="mt-2 flex flex-col gap-3 rounded-xl bg-[#F4F7F5] p-3">
      <div>
        <p className="mb-1.5 text-[13px] font-semibold">មូលហេតុកែតម្រូវ</p>
        <div role="radiogroup" aria-label="មូលហេតុ" className="flex flex-wrap gap-2">
          {adjustOptions.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={reason === o.id}
              onClick={() => { setReason(o.id); setAmount(""); setError(null); }}
              className={`h-11 rounded-full px-4 text-sm ${reason === o.id ? "bg-ink text-white" : "border-[1.5px] border-[#C3D6CD] bg-white"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {opt && (
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">
            {opt.mode === "remove" ? `ចំនួនដែល${opt.label} (ដកចេញពីស្តុក)` : "ចំនួនពិតដែលរាប់បាន"}
          </span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
            placeholder={opt.mode === "remove" ? "ឧ. 1" : String(stock)}
            className="h-12 rounded-xl border-[1.5px] border-[#C3D6CD] bg-white px-4 text-base focus:border-leaf focus:outline-none"
          />
        </label>
      )}

      {opt && n !== null && next !== null && (
        <p className="text-sm" aria-live="polite">
          {next < 0 ? (
            <span className="text-[#A3261B]">ស្តុកមានតែ {stock} មិនអាចដក {n} បានទេ</span>
          ) : diff === 0 ? (
            <span className="text-muted">ស្តុកដូចដែលមានស្រាប់</span>
          ) : (
            <>
              ស្តុក {stock} → <b>{next}</b>{" "}
              <span className={diff > 0 ? "text-[#163F7A]" : "text-[#8A1C12]"}>
                ({diff > 0 ? "+" : "−"}{Math.abs(diff)})
              </span>
            </>
          )}
        </p>
      )}

      {error && <p role="alert" className="text-sm text-[#A3261B]">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!valid || pending}
          className="h-11 flex-1 rounded-xl bg-leaf font-semibold text-white disabled:opacity-40"
        >
          {pending ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
        </button>
        <button type="button" onClick={onCancel} disabled={pending} className="h-11 rounded-xl border-[1.5px] border-[#C3D6CD] bg-white px-4 text-sm">
          បោះបង់
        </button>
      </div>

      <p className="text-xs leading-5 text-muted">
        ទំនិញទិញចូលថ្មី សូមបញ្ចូលក្នុង{" "}
        <Link href="/admin/finance" className="font-semibold text-leaf underline">Finance → ទិញចូល</Link>
        {" "}(ដើម្បីឱ្យថ្លៃដើម និងចំណេញត្រឹមត្រូវ)។
      </p>
    </div>
  );
}

const filters: { id: StockLevel | "all"; label: string }[] = [
  { id: "all", label: "ទាំងអស់" },
  { id: "out", label: stockStyle.out.label },
  { id: "low", label: stockStyle.low.label },
  { id: "ok", label: stockStyle.ok.label },
  { id: "untracked", label: stockStyle.untracked.label },
];

export function ProductAdminList({ products }: { products: AdminProduct[] }) {
  const [items, setItems] = useState(products);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StockLevel | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [openHistory, setOpenHistory] = useState<string | null>(null);
  const [openAdjust, setOpenAdjust] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function patch(id: string, change: Partial<AdminProduct>, save: () => Promise<{ ok: boolean; error?: string }>) {
    const before = items;
    setItems((list) => list.map((p) => (p.id === id ? { ...p, ...change } : p)));
    setError(null);
    startTransition(async () => {
      const res = await save();
      if (!res.ok) {
        setItems(before);
        setError(res.error ?? "រក្សាទុកមិនបាន");
      }
    });
  }

  const updateFlag = (id: string, flag: "in_stock" | "is_active", value: boolean) =>
    patch(id, { [flag]: value }, () => setProductFlag(id, flag, value));

  // បន្ទាប់ពីកែតម្រូវស្តុកជោគជ័យ (server បានរក្សាទុកហើយ)
  const onAdjusted = (id: string, stock: number) => {
    setItems((list) => list.map((p) => (p.id === id ? { ...p, stock, in_stock: stock > 0 } : p)));
    setOpenAdjust(null);
    setError(null);
  };

  const counts = items.reduce<Record<string, number>>((acc, p) => {
    const lvl = stockLevel(p.stock);
    acc[lvl] = (acc[lvl] ?? 0) + 1;
    return acc;
  }, {});

  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (p) =>
      (filter === "all" || stockLevel(p.stock) === filter) &&
      (!q || `${p.name_km} ${p.name_en}`.toLowerCase().includes(q)),
  );

  return (
    <>
      {/* សង្ខេប */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        {(["out", "low", "ok"] as const).map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => setFilter(filter === lvl ? "all" : lvl)}
            aria-pressed={filter === lvl}
            className={`flex flex-col items-start rounded-2xl p-3 text-left ${stockStyle[lvl].badge} ${filter === lvl ? "ring-2 ring-ink" : ""}`}
          >
            <span className="text-2xl font-bold">{counts[lvl] ?? 0}</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={`size-2 rounded-full ${stockStyle[lvl].dot}`} aria-hidden="true" />
              {stockStyle[lvl].label}
            </span>
          </button>
        ))}
      </div>

      <label className="mb-2 block">
        <span className="sr-only">ស្វែងរក</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ស្វែងរកផលិតផល..."
          className="h-12 w-full rounded-2xl border-[1.5px] border-[#C3D6CD] bg-white px-4 text-base focus:border-leaf focus:outline-none"
        />
      </label>

      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`h-10 shrink-0 rounded-full px-4 text-sm ${filter === f.id ? "bg-ink text-white" : "bg-white"}`}
          >
            {f.label}
            {f.id !== "all" && counts[f.id] ? ` (${counts[f.id]})` : ""}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mb-3 rounded-xl bg-[#FBE4E1] p-3 text-sm text-[#7A1D14]">{error}</p>}

      <ul className="flex flex-col gap-2.5">
        {shown.map((p) => {
          const level = stockLevel(p.stock);
          return (
            <li key={p.id} className={`rounded-2xl border-l-[6px] bg-white p-3 ${p.is_active ? "" : "opacity-70"}`} style={{ borderLeftColor: level === "out" ? "#D93A2B" : level === "low" ? "#E8A800" : level === "ok" ? "#2563C9" : "#C3D6CD" }}>
              <Link href={`/admin/products/${p.id}`} className="flex gap-3">
                <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ backgroundColor: p.tint }}>
                  {p.imageUrl ? <Image src={p.imageUrl} alt="" fill sizes="64px" className="object-cover" /> : <span className="text-xs text-muted">គ្មានរូប</span>}
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                  <span className="truncate font-semibold">{p.name_km}</span>
                  <span className="text-sm">{formatUSD(p.price)}</span>
                  <StockBadge stock={p.stock} />
                </span>
                <span className="self-center text-sm text-leaf">កែ ›</span>
              </Link>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-muted">ស្តុក</span>
                  <StockNumber stock={p.stock} />
                  {p.stock !== null && (
                    <button
                      type="button"
                      onClick={() => { setOpenAdjust(openAdjust === p.id ? null : p.id); setOpenHistory(null); }}
                      aria-expanded={openAdjust === p.id}
                      aria-controls={`adjust-${p.id}`}
                      className={`flex h-11 items-center rounded-xl px-3 text-[13px] ${openAdjust === p.id ? "bg-ink text-white" : "border-[1.5px] border-[#C3D6CD]"}`}
                    >
                      កែតម្រូវ
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setOpenHistory(openHistory === p.id ? null : p.id); setOpenAdjust(null); }}
                    aria-expanded={openHistory === p.id}
                    aria-controls={`history-${p.id}`}
                    className={`flex h-11 items-center gap-1.5 rounded-xl px-3 text-[13px] ${openHistory === p.id ? "bg-ink text-white" : "border-[1.5px] border-[#C3D6CD]"}`}
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 3v5h5M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    ប្រវត្តិ
                  </button>
                </div>
                <div className="flex flex-wrap gap-x-4">
                  {p.stock === null && (
                    <Toggle label="មានស្តុក" checked={p.in_stock} onChange={(v) => updateFlag(p.id, "in_stock", v)} />
                  )}
                  <Toggle label="បង្ហាញលើហាង" checked={p.is_active} onChange={(v) => updateFlag(p.id, "is_active", v)} />
                </div>
              </div>
              {(p.stock === 0 || p.stock === null) && (
                <Link href="/admin/finance" className="mt-2 flex h-11 items-center justify-center rounded-xl bg-[#E8F3EC] text-sm font-semibold text-leaf">
                  ទិញចូលក្នុង Finance →
                </Link>
              )}
              {openAdjust === p.id && p.stock !== null && (
                <div id={`adjust-${p.id}`}>
                  <StockAdjustPanel
                    key={`${p.id}-${p.stock}`}
                    id={p.id}
                    stock={p.stock}
                    onDone={(s) => onAdjusted(p.id, s)}
                    onCancel={() => setOpenAdjust(null)}
                  />
                </div>
              )}
              {openHistory === p.id && (
                <div id={`history-${p.id}`} className="mt-2 rounded-xl bg-[#F4F7F5] px-3">
                  <StockHistory productId={p.id} version={p.stock} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {shown.length === 0 && <p className="py-12 text-center text-muted">មិនមានផលិតផលក្នុងក្រុមនេះទេ</p>}
    </>
  );
}
