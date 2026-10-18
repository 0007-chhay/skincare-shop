import { getAdminClient } from "./supabase-admin";

// ខែគិតតាមម៉ោងកម្ពុជា (UTC+7)
export function currentMonth() {
  const now = new Date(Date.now() + 7 * 3600_000);
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(m: string, delta: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(m: string) {
  return { start: `${m}-01T00:00:00+07:00`, end: `${shiftMonth(m, 1)}-01T00:00:00+07:00` };
}

export function monthLabel(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, 15)).toLocaleDateString("km-KH", { month: "long", year: "numeric", timeZone: "UTC" });
}

export type FinanceProduct = { id: string; slug: string; name_km: string; stock: number | null; avg_cost: number | null; is_active: boolean };
export type Purchase = { id: number; created_at: string; product_id: string | null; product_name: string; qty: number; unit_cost: number; unit_other: number; actor: string | null };
type OrderItem = { slug: string; name: string; price: number; qty: number; cost?: number | null };
type PaidOrder = { total: number; paid_at: string; items: OrderItem[] };

const r2 = (n: number) => Math.round(n * 100) / 100;

function summarize(orders: PaidOrder[], purchases: Pick<Purchase, "qty" | "unit_cost" | "unit_other">[], costBySlug: Map<string, number | null>) {
  let revenue = 0;
  let cogs = 0;
  const missing = new Set<string>();
  const top = new Map<string, { name: string; qty: number; revenue: number; cost: number }>();

  for (const o of orders) {
    revenue += Number(o.total);
    for (const i of o.items ?? []) {
      const unitCost = i.cost ?? costBySlug.get(i.slug) ?? null;
      if (unitCost === null) missing.add(i.name);
      const c = (unitCost ?? 0) * i.qty;
      cogs += c;
      const t = top.get(i.slug) ?? { name: i.name, qty: 0, revenue: 0, cost: 0 };
      t.qty += i.qty;
      t.revenue += Number(i.price) * i.qty;
      t.cost += c;
      top.set(i.slug, t);
    }
  }
  const purchased = purchases.reduce((s, p) => s + p.qty * (Number(p.unit_cost) + Number(p.unit_other)), 0);

  return {
    orders: orders.length,
    revenue: r2(revenue),
    cogs: r2(cogs),
    purchased: r2(purchased),
    cashProfit: r2(revenue - purchased),
    realProfit: r2(revenue - cogs),
    missingCost: [...missing],
    top: [...top.values()].sort((a, b) => b.qty - a.qty).slice(0, 8),
  };
}

export async function getFinance(month: string) {
  const db = getAdminClient();
  const { start, end } = monthRange(month);
  const sixStart = monthRange(shiftMonth(month, -5)).start;

  const [productsRes, purchasesRes, ordersRes, lastBuysRes, sixOrdersRes, sixPurchasesRes] = await Promise.all([
    db.from("products").select("id, slug, name_km, stock, avg_cost, is_active").order("sort_order").order("created_at"),
    db.from("purchases").select("id, created_at, product_id, product_name, qty, unit_cost, unit_other, actor").eq("month", `${month}-01`).order("created_at", { ascending: false }),
    db.from("orders").select("total, paid_at, items").eq("status", "paid").gte("paid_at", start).lt("paid_at", end),
    db.from("purchases").select("product_id, unit_cost, unit_other").order("created_at", { ascending: false }).limit(500),
    db.from("orders").select("total, paid_at, items").eq("status", "paid").gte("paid_at", sixStart).lt("paid_at", end),
    db.from("purchases").select("month, qty, unit_cost, unit_other").gte("month", `${shiftMonth(month, -5)}-01`).lte("month", `${month}-01`),
  ]);
  for (const r of [productsRes, purchasesRes, ordersRes, lastBuysRes, sixOrdersRes, sixPurchasesRes]) {
    if (r.error) throw new Error(r.error.message);
  }

  const products = (productsRes.data ?? []) as FinanceProduct[];
  const costBySlug = new Map(products.map((p) => [p.slug, p.avg_cost === null ? null : Number(p.avg_cost)]));

  // តម្លៃទិញចុងក្រោយ — បំពេញទុកក្នុងទម្រង់
  const lastBuy: Record<string, { cost: number; other: number }> = {};
  for (const b of lastBuysRes.data ?? []) {
    if (b.product_id && !lastBuy[b.product_id]) lastBuy[b.product_id] = { cost: Number(b.unit_cost), other: Number(b.unit_other) };
  }

  const summary = summarize((ordersRes.data ?? []) as PaidOrder[], (purchasesRes.data ?? []) as Purchase[], costBySlug);

  // ៦ ខែចុងក្រោយ
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5));
  const trend = months.map((m) => {
    const { start: s, end: e } = monthRange(m);
    const [from, to] = [new Date(s).getTime(), new Date(e).getTime()];
    const os = ((sixOrdersRes.data ?? []) as PaidOrder[]).filter((o) => {
      const t = new Date(o.paid_at).getTime();
      return t >= from && t < to;
    });
    const ps = (sixPurchasesRes.data ?? []).filter((p) => String(p.month).startsWith(m));
    const x = summarize(os, ps, costBySlug);
    return { month: m, revenue: x.revenue, cashProfit: x.cashProfit, realProfit: x.realProfit };
  });

  const stockValue = r2(products.reduce((s, p) => s + Math.max(p.stock ?? 0, 0) * Number(p.avg_cost ?? 0), 0));

  return { products, purchases: (purchasesRes.data ?? []) as Purchase[], lastBuy, summary, trend, stockValue };
}
