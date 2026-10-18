"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUser, isAdminEmail } from "@/lib/admin-auth";
import { concerns as concernList } from "@/lib/concerns";
import { formatUSD } from "@/lib/format";
import { getAdminClient } from "@/lib/supabase-admin";
import { escapeHtml, sendTelegram } from "@/lib/telegram";
import { normalizeCode } from "@/lib/promo";
import { createAuthClient } from "@/lib/supabase-server";

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };

const NOT_ALLOWED = { ok: false as const, error: "សូម login ម្តងទៀត" };

// បន្ទាប់ពីកែផលិតផល — ឲ្យហាងបង្ហាញទិន្នន័យថ្មីភ្លាម
function refreshShop() {
  revalidatePath("/", "layout");
}

// ───────────── Login / Logout ─────────────

export async function signIn(email: string, password: string): Promise<Result> {
  email = email.trim().toLowerCase();
  if (!email || !password) return { ok: false, error: "សូមបំពេញ email និង password" };

  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, error: "Email ឬ password មិនត្រឹមត្រូវ" };

  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut();
    return { ok: false, error: "Account នេះមិនមានសិទ្ធិចូល Admin ទេ" };
  }
  redirect("/admin/products");
}

export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ───────────── ផលិតផល ─────────────

const validConcerns = new Set(concernList.map((c) => c.id).filter((id) => id !== "all"));
const text = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);
const orNull = (s: string) => (s ? s : null);

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueSlug(base: string) {
  const db = getAdminClient();
  const root = base || `product-${Date.now().toString(36)}`;
  const { data } = await db.from("products").select("slug").like("slug", `${root}%`);
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(root)) return root;
  for (let i = 2; ; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`;
}

export async function saveProduct(form: FormData): Promise<Result<{ id: string }>> {
  const user = await getAdminUser();
  if (!user) return NOT_ALLOWED;

  const id = text(form, "id", 60);
  const nameKm = text(form, "name_km", 120);
  const nameEn = text(form, "name_en", 120);
  const priceRaw = text(form, "price", 20).replace(/[$,\s]/g, "");
  const price = Number(priceRaw);
  const sortOrder = Math.trunc(Number(text(form, "sort_order", 10) || 0));
  const tint = text(form, "tint", 7);

  if (!nameKm) return { ok: false, error: "សូមបំពេញឈ្មោះខ្មែរ" };
  if (!priceRaw || !Number.isFinite(price) || price < 0 || price > 100000)
    return { ok: false, error: "តម្លៃមិនត្រឹមត្រូវ (ឧ. 12.50)" };

  const row: Record<string, unknown> = {
    name_km: nameKm,
    name_en: nameEn,
    price: Math.round(price * 100) / 100,
    size: orNull(text(form, "size", 40)),
    tag: orNull(text(form, "tag", 30)),
    description: text(form, "description", 1000),
    how_to_use: orNull(text(form, "how_to_use", 1500)),
    ingredients: orNull(text(form, "ingredients", 1500)),
    concerns: form.getAll("concerns").map(String).filter((c) => validConcerns.has(c as never)),
    in_stock: form.get("in_stock") === "on",
    stock: (() => {
      const raw = text(form, "stock", 6);
      if (raw === "") return null; // ទុកទទេ = មិនរាប់ស្តុក
      const n = Math.trunc(Number(raw));
      return Number.isFinite(n) && n >= 0 ? Math.min(n, 99999) : null;
    })(),
    is_active: form.get("is_active") === "on",
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
  if (/^#[0-9a-fA-F]{6}$/.test(tint)) row.tint = tint;

  const db = getAdminClient();

  // Upload រូប (បានបង្រួមទំហំរួចនៅក្នុង browser)
  const image = form.get("image");
  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) return { ok: false, error: "ឯកសារនេះមិនមែនជារូបភាពទេ" };
    if (image.size > 4 * 1024 * 1024) return { ok: false, error: "រូបធំពេក (លើស 4MB)" };
    const ext = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
    const base = slugify(nameEn) || "product";
    const path = `${base}-${Date.now().toString(36)}.${ext}`;
    const { error } = await db.storage.from("products").upload(path, image, { contentType: image.type });
    if (error) {
      console.error(error);
      return { ok: false, error: "Upload រូបមិនបាន សូមព្យាយាមម្តងទៀត" };
    }
    row.image = path;
  }

  if (id) {
    const { data: before } = await db.from("products").select("id, name_km, stock").eq("id", id).maybeSingle();
    const { error } = await db.from("products").update(row).eq("id", id);
    if (error) {
      console.error(error);
      return { ok: false, error: "រក្សាទុកមិនបាន សូមព្យាយាមម្តងទៀត" };
    }
    if (before) await logStockChange(before, row.stock as number | null, "edit", user.email);
    refreshShop();
    return { ok: true, data: { id } };
  }

  row.slug = await uniqueSlug(slugify(nameEn));
  const { data, error } = await db.from("products").insert(row).select("id").single();
  if (error || !data) {
    console.error(error);
    return { ok: false, error: "បន្ថែមមិនបាន សូមព្យាយាមម្តងទៀត" };
  }
  if (typeof row.stock === "number" && row.stock > 0)
    await logStockChange({ id: data.id, name_km: nameKm, stock: 0 }, row.stock, "edit", user.email);
  refreshShop();
  return { ok: true, data: { id: data.id } };
}

export async function setProductFlag(
  id: string,
  flag: "in_stock" | "is_active",
  value: boolean,
): Promise<Result> {
  if (!(await getAdminUser())) return NOT_ALLOWED;
  if (flag !== "in_stock" && flag !== "is_active") return { ok: false, error: "មិនត្រឹមត្រូវ" };
  const { error } = await getAdminClient().from("products").update({ [flag]: value }).eq("id", id);
  if (error) return { ok: false, error: "រក្សាទុកមិនបាន" };
  refreshShop();
  return { ok: true, data: null };
}

// កត់ត្រាប្រវត្តិស្តុក (បើបរាជ័យ មិនរារាំងការរក្សាទុកទេ)
async function logStockChange(
  product: { id: string; name_km: string; stock: number | null },
  newStock: number | null,
  reason: "manual" | "edit",
  actor: string | undefined,
) {
  if (newStock === null || newStock === product.stock) return;
  const { error } = await getAdminClient().from("stock_movements").insert({
    product_id: product.id,
    product_name: product.name_km,
    change: newStock - (product.stock ?? 0),
    stock_after: newStock,
    reason,
    actor: actor ?? null,
  });
  if (error) console.error("stock log:", error);
}

export async function setStock(id: string, stock: number | null): Promise<Result<{ stock: number | null }>> {
  const user = await getAdminUser();
  if (!user) return NOT_ALLOWED;
  const value = stock === null ? null : Math.max(0, Math.min(99999, Math.trunc(stock)));
  if (value !== null && !Number.isFinite(value)) return { ok: false, error: "ចំនួនមិនត្រឹមត្រូវ" };
  const db = getAdminClient();
  const { data: before } = await db.from("products").select("id, name_km, stock").eq("id", id).maybeSingle();
  const { error } = await db.from("products").update({ stock: value }).eq("id", id);
  if (error) return { ok: false, error: "រក្សាទុកមិនបាន" };
  if (before) await logStockChange(before, value, "manual", user.email);
  refreshShop();
  return { ok: true, data: { stock: value } };
}

export type StockMovement = {
  id: number;
  created_at: string;
  change: number;
  stock_after: number | null;
  reason: "order" | "manual" | "edit" | "cancel" | "purchase";
  order_id: number | null;
  actor: string | null;
};

export async function getStockHistory(productId: string): Promise<Result<StockMovement[]>> {
  if (!(await getAdminUser())) return NOT_ALLOWED;
  const { data, error } = await getAdminClient()
    .from("stock_movements")
    .select("id, created_at, change, stock_after, reason, order_id, actor")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return { ok: false, error: "ទាញប្រវត្តិមិនបាន" };
  return { ok: true, data: (data ?? []) as StockMovement[] };
}

// លុបជារៀងរហូត — ប៊ូតុងនៅលើទំព័រនឹងសួរបញ្ជាក់ជាមុនសិន
// (រូបភាពក្នុង Storage មិនត្រូវបានលុបទេ ដើម្បីសុវត្ថិភាព)
export async function deleteProduct(id: string): Promise<Result> {
  if (!(await getAdminUser())) return NOT_ALLOWED;
  const { error } = await getAdminClient().from("products").delete().eq("id", id);
  if (error) return { ok: false, error: "លុបមិនបាន" };
  refreshShop();
  return { ok: true, data: null };
}

// ───────────── កូដបញ្ចុះតម្លៃ ─────────────

export async function createPromo(form: FormData): Promise<Result> {
  if (!(await getAdminUser())) return NOT_ALLOWED;

  const code = normalizeCode(String(form.get("code") ?? ""));
  const kind = form.get("kind") === "fixed" ? "fixed" : "percent";
  const value = Number(String(form.get("value") ?? "").replace(/[$%,\s]/g, ""));
  const min = Number(String(form.get("min_subtotal") ?? "0").replace(/[$,\s]/g, "") || 0);
  const maxRaw = String(form.get("max_uses") ?? "").trim();
  const expiresRaw = String(form.get("expires_at") ?? "").trim();

  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return { ok: false, error: "កូដត្រូវមាន ៣–៣០ តួ (អក្សរអង់គ្លេស ឬលេខ)" };
  if (!Number.isFinite(value) || value <= 0) return { ok: false, error: "សូមដាក់ចំនួនបញ្ចុះ" };
  if (kind === "percent" && value > 100) return { ok: false, error: "ភាគរយមិនអាចលើស 100% ទេ" };
  if (!Number.isFinite(min) || min < 0) return { ok: false, error: "ចំនួនទិញអប្បបរមាមិនត្រឹមត្រូវ" };
  const maxUses = maxRaw === "" ? null : Math.trunc(Number(maxRaw));
  if (maxUses !== null && (!Number.isFinite(maxUses) || maxUses < 1)) return { ok: false, error: "ចំនួនប្រើមិនត្រឹមត្រូវ" };
  // ផុតកំណត់នៅចុងថ្ងៃ (ម៉ោងកម្ពុជា)
  const expiresAt = /^\d{4}-\d{2}-\d{2}$/.test(expiresRaw) ? new Date(`${expiresRaw}T23:59:59+07:00`).toISOString() : null;

  const { error } = await getAdminClient().from("promo_codes").insert({
    code,
    kind,
    value: Math.round(value * 100) / 100,
    min_subtotal: Math.round(min * 100) / 100,
    max_uses: maxUses,
    expires_at: expiresAt,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: `កូដ ${code} មានរួចហើយ` };
    console.error(error);
    return { ok: false, error: "បង្កើតមិនបាន សូមព្យាយាមម្តងទៀត" };
  }
  revalidatePath("/admin/promos");
  return { ok: true, data: null };
}

export async function setPromoActive(id: number, active: boolean): Promise<Result> {
  if (!(await getAdminUser())) return NOT_ALLOWED;
  const { error } = await getAdminClient().from("promo_codes").update({ is_active: active }).eq("id", id);
  if (error) return { ok: false, error: "រក្សាទុកមិនបាន" };
  revalidatePath("/admin/promos");
  return { ok: true, data: null };
}

// លុបជារៀងរហូត — ទំព័រនឹងសួរបញ្ជាក់ជាមុនសិន (order ចាស់ៗនៅតែចងចាំឈ្មោះកូដ)
export async function deletePromo(id: number): Promise<Result> {
  if (!(await getAdminUser())) return NOT_ALLOWED;
  const { error } = await getAdminClient().from("promo_codes").delete().eq("id", id);
  if (error) return { ok: false, error: "លុបមិនបាន" };
  revalidatePath("/admin/promos");
  return { ok: true, data: null };
}

// ───────────── បញ្ជាក់ Order ─────────────

function adminName(email: string | undefined) {
  return (email ?? "admin").split("@")[0];
}

type OrderForAdmin = {
  id: number;
  status: string;
  total: number;
  items: { slug: string; name: string; qty: number }[];
  promo_code: string | null;
  telegram_message_id: number | null;
  receipt_message_id: number | null;
};

async function loadOrder(id: number) {
  const { data } = await getAdminClient()
    .from("orders")
    .select("id, status, total, items, promo_code, telegram_message_id, receipt_message_id")
    .eq("id", id)
    .maybeSingle();
  return data as OrderForAdmin | null;
}

// ✅ បានបង់ → រាប់ជាចំណូល + សារ ៣ Reply ទៅវិក្កយបត្រ (ឬសារ order)
export async function confirmOrderPaid(id: number): Promise<Result> {
  const user = await getAdminUser();
  if (!user) return NOT_ALLOWED;
  const order = await loadOrder(id);
  if (!order) return { ok: false, error: "រក order មិនឃើញ" };
  if (order.status === "paid") return { ok: false, error: `Order #${id} បានបញ្ជាក់រួចហើយ` };
  if (order.status === "cancelled") return { ok: false, error: `Order #${id} ត្រូវបានបោះបង់រួចហើយ` };

  // update តែពេល status មិនទាន់ប្តូរ (ការពារ ២ នាក់ចុចព្រមគ្នា)
  const { data: updated, error } = await getAdminClient()
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString(), confirmed_by: user.email ?? null })
    .eq("id", id)
    .not("status", "in", "(paid,cancelled)")
    .select("id");
  if (error) return { ok: false, error: "រក្សាទុកមិនបាន" };
  if (!updated?.length) return { ok: false, error: `Order #${id} ត្រូវបានប្តូររួចហើយ សូម refresh` };

  await sendTelegram(
    process.env.TELEGRAM_ORDERS_CHAT_ID,
    `✅ <b>Admin check · Order #${id}</b>\n💵 ${formatUSD(Number(order.total))} · ពិនិត្យដោយ ${escapeHtml(adminName(user.email))}`,
    undefined,
    order.receipt_message_id ?? order.telegram_message_id,
  );

  revalidatePath("/admin/orders");
  return { ok: true, data: null };
}

// ✕ បោះបង់ → ស្តុកត្រឡប់វិញ + កូដបញ្ចុះតម្លៃរាប់វិញ + សារ ៣
export async function cancelOrder(id: number): Promise<Result> {
  const user = await getAdminUser();
  if (!user) return NOT_ALLOWED;
  const order = await loadOrder(id);
  if (!order) return { ok: false, error: "រក order មិនឃើញ" };
  if (order.status === "cancelled") return { ok: false, error: `Order #${id} ត្រូវបានបោះបង់រួចហើយ` };

  const db = getAdminClient();
  const { data: updated, error } = await db
    .from("orders")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), confirmed_by: user.email ?? null })
    .eq("id", id)
    .neq("status", "cancelled")
    .select("id");
  if (error) return { ok: false, error: "រក្សាទុកមិនបាន" };
  if (!updated?.length) return { ok: false, error: `Order #${id} ត្រូវបានប្តូររួចហើយ សូម refresh` };

  // ដាក់ស្តុកត្រឡប់វិញ (តែផលិតផលដែលរាប់ចំនួន)
  const movements: Record<string, unknown>[] = [];
  for (const item of order.items ?? []) {
    const { data: after, error: rpcError } = await db.rpc("restock", { p_slug: item.slug, p_qty: item.qty });
    if (rpcError) {
      console.error("restock:", rpcError.message);
      continue;
    }
    if (typeof after !== "number") continue; // ផលិតផលមិនរាប់ស្តុក
    const { data: product } = await db.from("products").select("id").eq("slug", item.slug).maybeSingle();
    movements.push({
      product_id: product?.id ?? null,
      product_name: item.name,
      change: item.qty,
      stock_after: after,
      reason: "cancel",
      order_id: id,
      actor: user.email ?? null,
    });
  }
  if (movements.length) {
    const { error: logError } = await db.from("stock_movements").insert(movements);
    if (logError) console.error("stock log:", logError.message);
  }

  if (order.promo_code) {
    const { error: promoError } = await db.rpc("release_promo", { p_code: order.promo_code });
    if (promoError) console.error("release promo:", promoError.message);
  }

  await sendTelegram(
    process.env.TELEGRAM_ORDERS_CHAT_ID,
    `✕ <b>Admin បោះបង់ · Order #${id}</b>\n💵 ${formatUSD(Number(order.total))} · ដោយ ${escapeHtml(adminName(user.email))}${movements.length ? "\n📦 ស្តុកត្រូវបានដាក់ត្រឡប់វិញ" : ""}`,
    undefined,
    order.receipt_message_id ?? order.telegram_message_id,
  );

  revalidatePath("/admin/orders");
  refreshShop(); // ស្តុកអាចត្រឡប់ពី "អស់" មកវិញ
  return { ok: true, data: null };
}

// ───────────── Finance ─────────────

const money = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
};

// បញ្ចូលការទិញចូល: +ស្តុក និងគណនាថ្លៃដើមមធ្យម (ក្នុង database ពេលតែមួយ)
export async function recordPurchase(input: {
  productId: string;
  month: string; // YYYY-MM
  cost: string;
  other: string;
  qty: string;
}): Promise<Result> {
  const user = await getAdminUser();
  if (!user) return NOT_ALLOWED;

  const cost = money(input.cost);
  const other = input.other.trim() === "" ? 0 : money(input.other);
  const qty = Math.trunc(Number(input.qty));
  if (!/^\d{4}-\d{2}$/.test(input.month)) return { ok: false, error: "ខែមិនត្រឹមត្រូវ" };
  if (!Number.isFinite(cost)) return { ok: false, error: "សូមដាក់ថ្លៃដើម" };
  if (!Number.isFinite(other)) return { ok: false, error: "\"ផ្សេងៗ\" មិនត្រឹមត្រូវ" };
  if (!Number.isFinite(qty) || qty < 1 || qty > 100000) return { ok: false, error: "សូមដាក់ចំនួនយកមក" };

  const { error } = await getAdminClient().rpc("record_purchase", {
    p_product_id: input.productId,
    p_qty: qty,
    p_cost: cost,
    p_other: other,
    p_month: `${input.month}-01`,
    p_actor: user.email ?? null,
  });
  if (error) {
    console.error("record_purchase:", error.message);
    return { ok: false, error: "បញ្ចូលមិនបាន សូមព្យាយាមម្តងទៀត" };
  }
  revalidatePath("/admin/finance");
  refreshShop();
  return { ok: true, data: null };
}

// លុបការបញ្ចូលខុស → ដកស្តុកវិញ (ទំព័រសួរបញ្ជាក់ជាមុន)
export async function deletePurchase(id: number): Promise<Result> {
  const user = await getAdminUser();
  if (!user) return NOT_ALLOWED;
  const { error } = await getAdminClient().rpc("delete_purchase", { p_id: id, p_actor: user.email ?? null });
  if (error) {
    console.error("delete_purchase:", error.message);
    return { ok: false, error: "លុបមិនបាន" };
  }
  revalidatePath("/admin/finance");
  refreshShop();
  return { ok: true, data: null };
}

// ថ្លៃដើមស្តុកចាស់ (ខែដំបូង) — មិនរាប់ជាចំណាយក្នុងខែនេះទេ
export async function setAvgCost(productId: string, value: string): Promise<Result> {
  if (!(await getAdminUser())) return NOT_ALLOWED;
  const cost = money(value);
  if (!Number.isFinite(cost)) return { ok: false, error: "ថ្លៃដើមមិនត្រឹមត្រូវ" };
  const { error } = await getAdminClient().from("products").update({ avg_cost: cost }).eq("id", productId);
  if (error) return { ok: false, error: "រក្សាទុកមិនបាន" };
  revalidatePath("/admin/finance");
  return { ok: true, data: null };
}
