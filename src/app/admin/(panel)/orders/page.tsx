import Link from "next/link";
import { OrderConfirmList, type AdminOrder } from "@/components/admin/OrderConfirmList";
import { getAdminClient } from "@/lib/supabase-admin";

type View = "pending" | "paid" | "cancelled";
const views: { id: View; label: string }[] = [
  { id: "pending", label: "⏳ រង់ចាំបញ្ជាក់" },
  { id: "paid", label: "✅ បានបង់" },
  { id: "cancelled", label: "✕ បោះបង់" },
];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ view?: string; q?: string }> }) {
  const sp = await searchParams;
  const view: View = sp.view === "paid" || sp.view === "cancelled" ? sp.view : "pending";
  const q = (sp.q ?? "").replace(/[^0-9]/g, "").slice(0, 10);

  const db = getAdminClient();
  let query = db
    .from("orders")
    .select("id, created_at, customer_name, phone, province, items, total, discount, promo_code, payment_method, receipt_count, status, paid_at, confirmed_by, note")
    .limit(50);
  if (q) {
    query = query.eq("id", Number(q));
  } else if (view === "pending") {
    query = query.not("status", "in", "(paid,cancelled)").order("id", { ascending: true });
  } else {
    query = query.eq("status", view).order(view === "paid" ? "paid_at" : "cancelled_at", { ascending: false });
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const { count: pendingCount } = await db
    .from("orders")
    .select("id", { count: "exact", head: true })
    .not("status", "in", "(paid,cancelled)");

  return (
    <>
      <h1 className="mb-3 text-xl font-bold">បញ្ជាក់ Order</h1>

      <form action="/admin/orders" className="mb-3 flex gap-2">
        <label className="flex-1">
          <span className="sr-only">ស្វែងរកលេខ order</span>
          <input
            name="q"
            defaultValue={q}
            inputMode="numeric"
            placeholder="ស្វែងរក #លេខ order"
            className="h-12 w-full rounded-2xl border-[1.5px] border-[#C3D6CD] bg-white px-4 text-base focus:border-leaf focus:outline-none"
          />
        </label>
        <button className="h-12 rounded-2xl bg-ink px-5 font-semibold text-white">រក</button>
      </form>

      {!q && (
        <nav aria-label="ស្ថានភាព" className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
          {views.map((v) => (
            <Link
              key={v.id}
              href={`/admin/orders?view=${v.id}`}
              aria-current={view === v.id ? "page" : undefined}
              className={`flex h-10 shrink-0 items-center rounded-full px-4 text-sm ${view === v.id ? "bg-ink text-white" : "bg-white"}`}
            >
              {v.label}
              {v.id === "pending" && pendingCount ? ` (${pendingCount})` : ""}
            </Link>
          ))}
        </nav>
      )}
      {q && (
        <p className="mb-3 text-sm text-muted">
          លទ្ធផលសម្រាប់ #{q} · <Link href="/admin/orders" className="text-leaf">មើលទាំងអស់</Link>
        </p>
      )}

      <OrderConfirmList orders={(data ?? []) as AdminOrder[]} />
    </>
  );
}
