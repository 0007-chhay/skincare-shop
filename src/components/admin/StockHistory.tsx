"use client";

import { useEffect, useState } from "react";
import { getStockHistory, type StockMovement } from "@/app/admin/actions";

const reasonLabel: Record<StockMovement["reason"], string> = {
  order: "លក់",
  manual: "កែដោយដៃ",
  edit: "កែក្នុងទម្រង់",
  cancel: "បោះបង់",
  purchase: "ទិញចូល",
};

function when(iso: string) {
  return new Date(iso).toLocaleString("km-KH", {
    timeZone: "Asia/Phnom_Penh",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function who(actor: string | null) {
  if (!actor || actor === "order") return null;
  return actor.split("@")[0];
}

// ប្រវត្តិស្តុករបស់ផលិតផលមួយ — ទាញពេលបើក និងពេលស្តុកប្តូរ
export function StockHistory({ productId, version }: { productId: string; version: number | null }) {
  const [rows, setRows] = useState<StockMovement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // រង់ចាំបន្តិច ឲ្យការរក្សាទុកស្តុករួចសិន
    const t = setTimeout(async () => {
      const res = await getStockHistory(productId);
      if (cancelled) return;
      if (res.ok) setRows(res.data);
      else setError(res.error);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [productId, version]);

  if (error) return <p className="py-2 text-sm text-[#A3261B]">{error}</p>;
  if (!rows) return <p className="py-3 text-center text-sm text-muted">កំពុងទាញ...</p>;
  if (rows.length === 0) return <p className="py-3 text-center text-sm text-muted">មិនទាន់មានប្រវត្តិទេ</p>;

  return (
    <ol className="flex flex-col divide-y divide-line">
      {rows.map((m) => {
        const plus = m.change > 0;
        return (
          <li key={m.id} className="flex items-center gap-3 py-2 text-sm">
            <span
              className={`w-12 shrink-0 rounded-lg py-1 text-center font-bold ${plus ? "bg-[#DCE8FA] text-[#163F7A]" : "bg-[#FBE4E1] text-[#8A1C12]"}`}
            >
              {plus ? "+" : "−"}{Math.abs(m.change)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate">
                {m.order_id && (m.reason === "order" || m.reason === "cancel")
                  ? `${m.reason === "order" ? "លក់" : "បោះបង់"} · Order #${m.order_id}`
                  : m.reason === "manual" && m.note
                    ? `កែតម្រូវ · ${m.note}`
                    : reasonLabel[m.reason]}
                {who(m.actor) && <span className="text-muted"> · {who(m.actor)}</span>}
              </span>
              <span className="text-xs text-muted">{when(m.created_at)}</span>
            </span>
            {m.stock_after !== null && (
              <span className="shrink-0 text-xs text-muted">
                នៅសល់ <b className="text-ink">{m.stock_after}</b>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
