"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePurchase, recordPurchase, setAvgCost } from "@/app/admin/actions";
import type { FinanceProduct, Purchase } from "@/lib/finance";
import { formatUSD } from "@/lib/format";

const input =
  "h-11 w-full rounded-xl border-[1.5px] border-[#C3D6CD] bg-white px-3 text-base text-ink placeholder:text-[#8AA197] focus:border-leaf focus:outline-none";

function ProductRow({
  product,
  month,
  last,
  onDone,
}: {
  product: FinanceProduct;
  month: string;
  last?: { cost: number; other: number };
  onDone: (msg: string, ok: boolean) => void;
}) {
  const [cost, setCost] = useState(last ? String(last.cost) : "");
  const [other, setOther] = useState(last ? String(last.other) : "");
  const [qty, setQty] = useState("");
  const [opening, setOpening] = useState("");
  const [pending, start] = useTransition();

  const unit = (Number(cost) || 0) + (Number(other) || 0);
  const total = unit * (Number(qty) || 0);
  const needsOpening = product.avg_cost === null && (product.stock ?? 0) > 0;

  function add() {
    if (!window.confirm(`បញ្ចូល ${product.name_km}\n${qty} × ${formatUSD(unit)} = ${formatUSD(total)}\n\nស្តុកនឹងបន្ថែម +${qty}`)) return;
    start(async () => {
      const res = await recordPurchase({ productId: product.id, month, cost, other, qty });
      if (res.ok) {
        setQty("");
        onDone(`✓ ${product.name_km} +${qty}`, true);
      } else onDone(res.error, false);
    });
  }

  function saveOpening() {
    start(async () => {
      const res = await setAvgCost(product.id, opening);
      onDone(res.ok ? `✓ ថ្លៃដើមស្តុកចាស់ ${product.name_km}` : res.error, res.ok);
    });
  }

  return (
    <li className="rounded-2xl bg-white p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="font-semibold">{product.name_km}</p>
        <p className="shrink-0 text-xs text-muted">
          ស្តុក <b className="text-ink">{product.stock ?? "—"}</b>
          {product.avg_cost !== null && <> · ថ្លៃដើមមធ្យម <b className="text-ink">{formatUSD(Number(product.avg_cost))}</b></>}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted">
          ថ្លៃដើម ($)
          <input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" placeholder="9.00" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          ផ្សេងៗ ($)
          <input value={other} onChange={(e) => setOther(e.target.value)} inputMode="decimal" placeholder="1.00" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          យកមក
          <input value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="20" className={input} />
        </label>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {qty ? <>មួយដប {formatUSD(unit)} · សរុប <b className="text-ink">{formatUSD(total)}</b></> : "ផ្សេងៗ = ពន្ធ ដឹកជញ្ជូន ... ក្នុងមួយដប"}
        </p>
        <button
          type="button"
          onClick={add}
          disabled={pending || !qty || cost === ""}
          className="h-11 shrink-0 rounded-xl bg-leaf px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? "..." : "+ បញ្ចូល"}
        </button>
      </div>

      {needsOpening && (
        <div className="mt-3 rounded-xl bg-[#FDF1C7] p-3">
          <p className="mb-2 text-xs leading-5 text-[#6B4A00]">
            ស្តុក {product.stock} ដបដែលមានស្រាប់ មិនទាន់មានថ្លៃដើម។ ដាក់ថ្លៃដើម (រួមទាំងផ្សេងៗ) ក្នុងមួយដប — <b>មិនរាប់ជាចំណាយខែនេះទេ</b>។
          </p>
          <div className="flex gap-2">
            <input value={opening} onChange={(e) => setOpening(e.target.value)} inputMode="decimal" placeholder="ថ្លៃដើមស្តុកចាស់ ($)" aria-label="ថ្លៃដើមស្តុកចាស់" className={input} />
            <button type="button" onClick={saveOpening} disabled={pending || !opening} className="h-11 shrink-0 rounded-xl bg-ink px-4 text-sm font-semibold text-white disabled:opacity-40">
              រក្សាទុក
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export function FinanceEntry({
  month,
  monthText,
  products,
  purchases,
  lastBuy,
}: {
  month: string;
  monthText: string;
  products: FinanceProduct[];
  purchases: Purchase[];
  lastBuy: Record<string, { cost: number; other: number }>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [deleting, startDelete] = useTransition();

  function done(text: string, ok: boolean) {
    setMessage({ text, ok });
    if (ok) router.refresh();
  }

  function remove(p: Purchase) {
    if (!window.confirm(`លុបការបញ្ចូល "${p.product_name} +${p.qty}" មែនទេ?\n\nស្តុកនឹងដក −${p.qty} វិញ។ មិនអាចយកមកវិញបានទេ។`)) return;
    startDelete(async () => {
      const res = await deletePurchase(p.id);
      done(res.ok ? `✓ បានលុប ${p.product_name} +${p.qty}` : res.error, res.ok);
    });
  }

  const q = query.trim().toLowerCase();
  const shown = products.filter((p) => !q || p.name_km.toLowerCase().includes(q));
  const totalPurchased = purchases.reduce((s, p) => s + p.qty * (Number(p.unit_cost) + Number(p.unit_other)), 0);

  return (
    <>
      <section className="flex flex-col gap-2.5">
        <h2 className="font-semibold">🛒 ទិញចូល · {monthText}</h2>
        {message && (
          <p role={message.ok ? "status" : "alert"} className={`rounded-xl p-3 text-sm ${message.ok ? "bg-[#D7EAE2]" : "bg-[#FBE4E1] text-[#7A1D14]"}`}>
            {message.text}
          </p>
        )}
        <label>
          <span className="sr-only">ស្វែងរកផលិតផល</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ស្វែងរកផលិតផល..." className={`${input} h-12 rounded-2xl`} />
        </label>
        <ul className="flex flex-col gap-2">
          {shown.map((p) => (
            <ProductRow key={p.id} product={p} month={month} last={lastBuy[p.id]} onDone={done} />
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-semibold">បានបញ្ចូលខែនេះ</h2>
          <p className="text-sm">សរុប <b>{formatUSD(totalPurchased)}</b></p>
        </div>
        {purchases.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">មិនទាន់មានការទិញចូលទេ</p>
        ) : (
          <ul className="divide-y divide-line">
            {purchases.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{p.product_name} <b>+{p.qty}</b></span>
                  <span className="text-xs text-muted">
                    {p.qty} × ({formatUSD(Number(p.unit_cost))} + {formatUSD(Number(p.unit_other))}) = {formatUSD(p.qty * (Number(p.unit_cost) + Number(p.unit_other)))}
                  </span>
                </span>
                <button type="button" onClick={() => remove(p)} disabled={deleting} className="h-11 shrink-0 rounded-xl px-3 text-[#A3261B] disabled:opacity-50">
                  លុប
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
