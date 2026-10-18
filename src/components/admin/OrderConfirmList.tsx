"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelOrder, confirmOrderPaid } from "@/app/admin/actions";
import { formatUSD } from "@/lib/format";

export type AdminOrder = {
  id: number;
  created_at: string;
  customer_name: string;
  phone: string;
  province: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  discount: number | null;
  promo_code: string | null;
  payment_method: "khqr" | "cod";
  receipt_count: number;
  status: string;
  paid_at: string | null;
  confirmed_by: string | null;
  note: string | null;
};

function when(iso: string) {
  return new Date(iso).toLocaleString("km-KH", { timeZone: "Asia/Phnom_Penh", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function OrderConfirmList({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [, startTransition] = useTransition();

  function run(order: AdminOrder, action: "paid" | "cancel") {
    const text =
      action === "paid"
        ? `បញ្ជាក់ថា Order #${order.id} (${formatUSD(Number(order.total))}) បានបង់លុយហើយមែនទេ?\n\nសូមពិនិត្យថាលុយចូលគណនីពិតប្រាកដ។`
        : `បោះបង់ Order #${order.id} មែនទេ?\n\nស្តុកនឹងត្រូវដាក់ត្រឡប់វិញ ហើយ order នេះនឹងមិនរាប់ជាចំណូលទេ។`;
    if (!window.confirm(text)) return;
    setBusy(order.id);
    setMessage(null);
    startTransition(async () => {
      const res = action === "paid" ? await confirmOrderPaid(order.id) : await cancelOrder(order.id);
      setBusy(null);
      if (res.ok) {
        setMessage({ type: "ok", text: action === "paid" ? `✅ Order #${order.id} បានបញ្ជាក់` : `✕ Order #${order.id} បានបោះបង់` });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error });
      }
    });
  }

  return (
    <>
      {message && (
        <p role={message.type === "error" ? "alert" : "status"} className={`mb-3 rounded-xl p-3 text-sm ${message.type === "error" ? "bg-[#FBE4E1] text-[#7A1D14]" : "bg-[#D7EAE2]"}`}>
          {message.text}
        </p>
      )}

      {orders.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-muted">មិនមាន order ទេ 🎉</p>}

      <ul className="flex flex-col gap-2.5">
        {orders.map((o) => {
          const pending = o.status !== "paid" && o.status !== "cancelled";
          return (
            <li key={o.id} className="rounded-2xl bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    #{o.id} · {o.customer_name}
                  </p>
                  <a href={`tel:${o.phone}`} className="text-sm text-leaf">{o.phone}</a>
                  <span className="text-sm text-muted"> · {o.province}</span>
                </div>
                <p className="shrink-0 text-lg font-bold">{formatUSD(Number(o.total))}</p>
              </div>

              <ul className="mt-2 text-sm text-muted">
                {o.items.map((i, idx) => (
                  <li key={idx}>• {i.name} × {i.qty}</li>
                ))}
              </ul>

              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-full bg-[#EEF1EF] px-2.5 py-1">{o.payment_method === "khqr" ? "KHQR" : "បង់ពេលទទួល"}</span>
                {o.payment_method === "khqr" && (
                  <span className={`rounded-full px-2.5 py-1 ${o.receipt_count > 0 ? "bg-[#DCE8FA] text-[#163F7A]" : "bg-[#FDF1C7] text-[#6B4A00]"}`}>
                    {o.receipt_count > 0 ? "🧾 បានផ្ញើវិក្កយបត្រ" : "មិនទាន់ផ្ញើវិក្កយបត្រ"}
                  </span>
                )}
                {o.promo_code && <span className="rounded-full bg-[#EEF1EF] px-2.5 py-1">🎟 {o.promo_code} −{formatUSD(Number(o.discount ?? 0))}</span>}
                <span className="px-1 py-1 text-muted">{when(o.created_at)}</span>
              </div>
              {o.note && <p className="mt-1 text-sm">📝 {o.note}</p>}

              {pending ? (
                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 border-t border-line pt-3">
                  <button
                    type="button"
                    onClick={() => run(o, "paid")}
                    disabled={busy !== null}
                    className="h-12 rounded-2xl bg-leaf font-semibold text-white disabled:opacity-50"
                  >
                    {busy === o.id ? "..." : "✅ បានបង់"}
                  </button>
                  <button
                    type="button"
                    onClick={() => run(o, "cancel")}
                    disabled={busy !== null}
                    className="h-12 rounded-2xl border-[1.5px] border-[#C3D6CD] px-4 text-sm text-[#A3261B] disabled:opacity-50"
                  >
                    ✕ បោះបង់
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3 text-sm">
                  <span className={o.status === "paid" ? "font-semibold text-leaf" : "font-semibold text-[#A3261B]"}>
                    {o.status === "paid" ? "✅ បានបង់" : "✕ បានបោះបង់"}
                    {o.confirmed_by && <span className="font-normal text-muted"> · {o.confirmed_by.split("@")[0]}</span>}
                    {o.paid_at && o.status === "paid" && <span className="font-normal text-muted"> · {when(o.paid_at)}</span>}
                  </span>
                  {o.status === "paid" && (
                    <button type="button" onClick={() => run(o, "cancel")} disabled={busy !== null} className="h-11 rounded-xl px-3 text-[#A3261B] disabled:opacity-50">
                      បោះបង់
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
