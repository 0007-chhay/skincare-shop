"use server";

import { revalidatePath } from "next/cache";
import { formatUSD } from "@/lib/format";
import { evaluatePromo, normalizeCode, promoErrors, type PromoCode } from "@/lib/promo";
import { LOW_STOCK } from "@/lib/stock";
import { DELIVERY_FEE, normalizePhone, paymentLabels, provinces, type PaymentMethod } from "@/lib/shop";
import { getAdminClient } from "@/lib/supabase-admin";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { escapeHtml, sendTelegram, sendTelegramPhoto } from "@/lib/telegram";

type Result<T> = { ok: true; data: T } | { ok: false; error: string; code?: "rate_limit" };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// គណនាតម្លៃកន្ត្រកពី database (មិនទុកចិត្តតម្លៃពី browser ទេ)
type CartLineInput = { slug: string; qty: number }[];
type PricedItem = { slug: string; name: string; price: number; qty: number; cost: number | null };
type ProductRowLite = { id: string; slug: string; name_km: string; price: number; in_stock: boolean; is_active: boolean; stock: number | null; avg_cost: number | null };

async function priceCart(lines: CartLineInput): Promise<Result<{ items: PricedItem[]; rows: ProductRowLite[]; subtotal: number }>> {
  // រួមបញ្ចូលផលិតផលដដែលៗ និងពិនិត្យចំនួន
  const qtyBySlug = new Map<string, number>();
  for (const l of Array.isArray(lines) ? lines.slice(0, 50) : []) {
    const qty = Math.floor(Number(l?.qty));
    if (typeof l?.slug !== "string" || !Number.isFinite(qty) || qty < 1 || qty > 99) continue;
    qtyBySlug.set(l.slug, Math.min(99, (qtyBySlug.get(l.slug) ?? 0) + qty));
  }
  if (qtyBySlug.size === 0) return { ok: false, error: "កន្ត្រករបស់អ្នកនៅទទេ" };

  const db = getAdminClient();
  // យកតម្លៃពី database (មិនទុកចិត្តតម្លៃពី browser ទេ)
  const { data: rows, error: productError } = await db
    .from("products")
    .select("id, slug, name_km, price, in_stock, is_active, stock, avg_cost")
    .in("slug", [...qtyBySlug.keys()]);
  if (productError) {
    console.error(productError);
    return { ok: false, error: "មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត" };
  }

  const items: PricedItem[] = [];
  for (const [slug, qty] of qtyBySlug) {
    const p = rows?.find((r) => r.slug === slug);
    if (!p || !p.is_active) return { ok: false, error: "ផលិតផលខ្លះមិនមានលក់ទៀតទេ សូមពិនិត្យកន្ត្រកម្តងទៀត" };
    if (!p.in_stock) return { ok: false, error: `${p.name_km} អស់ស្តុកហើយ សូមដកចេញពីកន្ត្រក` };
    if (p.stock !== null && qty > p.stock)
      return { ok: false, error: `${p.name_km} នៅសល់តែ ${p.stock} ប៉ុណ្ណោះ សូមកែចំនួនក្នុងកន្ត្រក` };
    // ចងចាំថ្លៃដើមនៅពេលលក់ (សម្រាប់ Finance)
    items.push({ slug, name: p.name_km, price: Number(p.price), qty, cost: p.avg_cost === null ? null : Number(p.avg_cost) });
  }

  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
  return { ok: true, data: { items, rows: (rows ?? []) as ProductRowLite[], subtotal } };
}

// ពិនិត្យកូដបញ្ចុះតម្លៃ ពេលអតិថិជនចុច "ប្រើ" (មិនទាន់រាប់ចំនួនប្រើទេ)
export async function checkPromo(code: string, lines: CartLineInput): Promise<Result<{ code: string; discount: number }>> {
  const normalized = normalizeCode(String(code ?? "")).slice(0, 30);
  if (normalized.length < 3) return { ok: false, error: "សូមវាយកូដបញ្ចុះតម្លៃ" };
  const priced = await priceCart(lines);
  if (!priced.ok) return priced;
  const { data } = await getAdminClient().from("promo_codes").select("*").eq("code", normalized).maybeSingle();
  const res = evaluatePromo(data as PromoCode | null, priced.data.subtotal);
  if (!res.ok) return res;
  return { ok: true, data: { code: normalized, discount: res.discount } };
}

// ───────────────────────── Order ─────────────────────────

export type OrderInput = {
  lines: { slug: string; qty: number }[];
  name: string;
  phone: string;
  telegram?: string;
  province: string;
  address: string;
  mapLink?: string;
  payment: PaymentMethod;
  note?: string;
  promoCode?: string;
  website?: string; // honeypot — មនុស្សមើលមិនឃើញ មានតែ bot ប៉ុណ្ណោះដែលបំពេញ
};

// ───── ការពារ order ក្លែង ─────
// ចំនួន order អតិបរមាក្នុងមួយ IP ក្នុង ២៤ ម៉ោង — ប្តូរបានដោយមិនកែកូដ៖
// Vercel → Settings → Environment Variables → ORDER_LIMIT_PER_IP_PER_DAY (ឧ. 10)
const ORDER_LIMIT_PER_IP_PER_DAY = Math.max(1, Math.trunc(Number(process.env.ORDER_LIMIT_PER_IP_PER_DAY)) || 5);
const RATE_LIMIT_MESSAGE =
  "បណ្តាញរបស់អ្នកបានបញ្ជាទិញច្រើនរួចហើយថ្ងៃនេះ។ សូមរង់ចាំបន្តិច ហើយព្យាយាមម្តងទៀត ឬទាក់ទងហាងតាម Telegram ដើម្បីបញ្ជាទិញ។";

// កត់ IP ជា hash (មិនរក្សា IP ដើមទេ)។ គ្មាន IP (ឧ. ពេលតេស្តលើ localhost) → មិនកំណត់ចំនួន
async function clientIpHash(): Promise<string | null> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "oss-skincare";
  return createHmac("sha256", salt).update(ip).digest("hex").slice(0, 32);
}

export async function placeOrder(input: OrderInput): Promise<Result<{ orderId: number; total: number; receiptKey: string }>> {
  // Honeypot: មានតែ bot ប៉ុណ្ណោះដែលបំពេញប្រអប់លាក់ → ធ្វើដូចជោគជ័យ តែមិនបង្កើតអ្វីទាំងអស់
  if (input.website) {
    console.warn("honeypot: bot order blocked");
    return { ok: true, data: { orderId: 0, total: 0, receiptKey: randomBytes(12).toString("hex") } };
  }

  const name = clean(input.name, 80);
  const phone = normalizePhone(clean(input.phone, 20));
  const telegram = clean(input.telegram, 40).replace(/[^A-Za-z0-9_]/g, "");
  const province = clean(input.province, 40);
  const address = clean(input.address, 300);
  const mapLink = clean(input.mapLink, 300);
  const note = clean(input.note, 300);
  const payment = input.payment;

  if (!name) return { ok: false, error: "សូមបំពេញឈ្មោះ" };
  if (!phone) return { ok: false, error: "លេខទូរស័ព្ទមិនត្រឹមត្រូវ (ឧ. 012 345 678)" };
  if (!provinces.includes(province)) return { ok: false, error: "សូមជ្រើសរាជធានី/ខេត្ត" };
  if (address.length < 5) return { ok: false, error: "សូមបំពេញអាសយដ្ឋានឲ្យបានលម្អិត" };
  if (payment !== "khqr" && payment !== "cod") return { ok: false, error: "សូមជ្រើសវិធីបង់ប្រាក់" };
  if (mapLink && !/^https?:\/\//.test(mapLink)) return { ok: false, error: "Link ទីតាំងមិនត្រឹមត្រូវ" };

  const db = getAdminClient();

  // Rate limit: រាប់ order ពី IP នេះក្នុង ២៤ ម៉ោងចុងក្រោយ (រួមទាំង order ដែលបោះបង់)
  const ipHash = await clientIpHash();
  if (ipHash) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: limitError } = await db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    // បើ query បរាជ័យ (ឧ. ជួរ ip_hash មិនទាន់មាន) មិនរារាំងអតិថិជនទេ
    if (limitError) console.error("rate limit:", limitError.message);
    else if ((count ?? 0) >= ORDER_LIMIT_PER_IP_PER_DAY) return { ok: false, error: RATE_LIMIT_MESSAGE, code: "rate_limit" };
  }

  const priced = await priceCart(input.lines);
  if (!priced.ok) return priced;
  const { items, rows, subtotal } = priced.data;

  // កូដបញ្ចុះតម្លៃ (ពិនិត្យ និងរាប់ចំនួនប្រើ នៅក្នុង database ក្នុងពេលតែមួយ)
  const promoCode = input.promoCode ? normalizeCode(input.promoCode) : "";
  let discount = 0;
  if (promoCode) {
    const { data: d, error: promoError } = await db.rpc("redeem_promo", { p_code: promoCode, p_subtotal: subtotal });
    if (promoError) {
      const key = Object.keys(promoErrors).find((k) => promoError.message.includes(k));
      return { ok: false, error: key ? promoErrors[key] : "កូដបញ្ចុះតម្លៃមិនត្រឹមត្រូវ" };
    }
    discount = Math.round(Number(d) * 100) / 100;
  }

  const total = Math.round((subtotal - discount + DELIVERY_FEE) * 100) / 100;

  const receiptKey = randomBytes(12).toString("hex");

  const orderRow: Record<string, unknown> = {
      receipt_token: receiptKey,
      customer_name: name,
      phone,
      telegram: telegram || null,
      province,
      address,
      map_link: mapLink || null,
      payment_method: payment,
      note: note || null,
      items,
      subtotal,
      discount,
      promo_code: promoCode || null,
      delivery_fee: DELIVERY_FEE,
      total,
  };
  // ip_hash = ជួរសម្រាប់កំណត់ចំនួន order ក្នុងមួយ IP (ត្រូវ run step14-order-ratelimit.sql)
  let { data: order, error: insertError } = await db
    .from("orders")
    .insert(ipHash ? { ...orderRow, ip_hash: ipHash } : orderRow)
    .select("id")
    .single();
  // ជួរ ip_hash មិនទាន់មាន → រក្សា order ដោយគ្មាន ip_hash (កុំបាត់ order របស់អតិថិជន)
  if (insertError && /ip_hash/.test(insertError.message ?? "")) {
    ({ data: order, error: insertError } = await db.from("orders").insert(orderRow).select("id").single());
  }
  if (insertError || !order) {
    console.error(insertError);
    return { ok: false, error: "មិនអាចរក្សាទុក order បានទេ សូមព្យាយាមម្តងទៀត" };
  }

  // កាត់ស្តុក (តែផលិតផលដែលរាប់ចំនួន)
  const stockAlerts: string[] = [];
  const movements: Record<string, unknown>[] = [];
  let soldOut = false;
  for (const item of items) {
    const p = rows?.find((r) => r.slug === item.slug);
    if (p?.stock === null || p?.stock === undefined) continue;
    const { data: left, error: stockError } = await db.rpc("decrement_stock", { p_slug: item.slug, p_qty: item.qty });
    if (stockError) {
      console.error(stockError);
      continue;
    }
    const remaining = typeof left === "number" ? left : Math.max(0, p.stock - item.qty);
    movements.push({
      product_id: p.id,
      product_name: item.name,
      change: -item.qty,
      stock_after: remaining,
      reason: "order",
      order_id: order.id,
      actor: "order",
    });
    if (remaining === 0) {
      soldOut = true;
      stockAlerts.push(`🔴 ${escapeHtml(item.name)} អស់ស្តុកហើយ`);
    } else if (remaining <= LOW_STOCK) {
      stockAlerts.push(`🟡 ${escapeHtml(item.name)} នៅសល់ ${remaining}`);
    }
  }
  if (movements.length) {
    const { error: logError } = await db.from("stock_movements").insert(movements);
    if (logError) console.error("stock log:", logError);
  }
  if (soldOut) revalidatePath("/", "layout"); // ឲ្យហាងបង្ហាញ "អស់ស្តុក" ភ្លាម

  // ជូនដំណឹងទៅក្រុម Order (បើផ្ញើមិនបាន order នៅតែរក្សាទុកក្នុង database)
  const e = escapeHtml;
  const lines = [
    `🛍 <b>Order ថ្មី #${order.id}</b> · ${payment === "khqr" ? "⏳ រង់ចាំការបង់ប្រាក់" : "💵 បង់ពេលទទួល"}`,
    "",
    `👤 ${e(name)} · <a href="tel:${phone}">${phone}</a>`,
    telegram ? `✈️ <a href="https://t.me/${e(telegram)}">@${e(telegram)}</a>` : null,
    `📍 ${e(province)} · ${e(address)}`,
    mapLink ? `🗺 <a href="${e(mapLink)}">មើលទីតាំង</a>` : null,
    "",
    ...items.map((i) => `• ${e(i.name)} × ${i.qty} = ${formatUSD(i.price * i.qty)}`),
    "",
    discount > 0 ? `🎟 កូដ ${e(promoCode)} · បញ្ចុះ −${formatUSD(discount)}` : null,
    `💵 <b>សរុប ${formatUSD(total)}</b> · ${e(paymentLabels[payment])}`,
    note ? `📝 ${e(note)}` : null,
    stockAlerts.length ? `\n⚠️ <b>ស្តុក</b>\n${stockAlerts.join("\n")}` : null,
  ].filter((l) => l !== null);
  const messageId = await sendTelegram(process.env.TELEGRAM_ORDERS_CHAT_ID, lines.join("\n"));
  if (messageId) {
    // ចងចាំសារ ១ ដើម្បីឲ្យ Admin Reply ពេលបញ្ជាក់
    const { error: idError } = await db.from("orders").update({ telegram_message_id: messageId }).eq("id", order.id);
    if (idError) console.error("save telegram id:", idError.message);
  }

  return { ok: true, data: { orderId: order.id, total, receiptKey } };
}

// ───────────────────────── សំណួរ ─────────────────────────

export type QuestionInput = {
  productSlug?: string;
  productName?: string;
  name: string;
  contact: string;
  message: string;
  website?: string; // honeypot
};

export async function askQuestion(input: QuestionInput): Promise<Result<null>> {
  if (input.website) return { ok: true, data: null };

  const name = clean(input.name, 80);
  const contact = clean(input.contact, 60);
  const message = clean(input.message, 1000);
  const productSlug = clean(input.productSlug, 80);
  const productName = clean(input.productName, 120);

  if (!name) return { ok: false, error: "សូមបំពេញឈ្មោះ" };
  if (contact.length < 5) return { ok: false, error: "សូមដាក់លេខទូរស័ព្ទ ឬ Telegram ដើម្បីឲ្យហាងឆ្លើយតបបាន" };
  if (message.length < 3) return { ok: false, error: "សូមសរសេរសំណួររបស់អ្នក" };

  const { error } = await getAdminClient()
    .from("questions")
    .insert({ product_slug: productSlug || null, name, contact, message });
  if (error) {
    console.error(error);
    return { ok: false, error: "មិនអាចផ្ញើបានទេ សូមព្យាយាមម្តងទៀត" };
  }

  const e = escapeHtml;
  const phone = normalizePhone(contact);
  const tg = /^@[A-Za-z0-9_]{3,32}$/.test(contact) ? contact.slice(1) : null;
  const contactLine = phone
    ? `<a href="tel:${phone}">${phone}</a>`
    : tg
      ? `<a href="https://t.me/${e(tg)}">@${e(tg)}</a>`
      : e(contact);

  await sendTelegram(
    process.env.TELEGRAM_QUESTIONS_CHAT_ID,
    [
      `💬 <b>សំណួរថ្មី</b>${productName ? ` · ${e(productName)}` : ""}`,
      "",
      `👤 ${e(name)} · ${contactLine}`,
      "",
      e(message),
    ].join("\n"),
    // bot សំណួរ (បើមិនបានដាក់ នឹងប្រើ bot order ជំនួស)
    process.env.TELEGRAM_QUESTIONS_BOT_TOKEN,
  );

  return { ok: true, data: null };
}

// ───────────────────────── វិក្កយបត្រ ─────────────────────────

const MAX_RECEIPTS = 5;

export async function uploadReceipt(form: FormData): Promise<Result<null>> {
  const orderId = Number(form.get("no"));
  const key = String(form.get("k") ?? "");
  const photo = form.get("photo");

  if (!Number.isInteger(orderId) || orderId < 1 || !/^[0-9a-f]{24}$/.test(key))
    return { ok: false, error: "Link នេះមិនត្រឹមត្រូវ សូមផ្ញើវិក្កយបត្រតាម Telegram ជំនួសវិញ" };
  if (!(photo instanceof File) || photo.size === 0) return { ok: false, error: "សូមជ្រើសរូបវិក្កយបត្រ" };
  if (!photo.type.startsWith("image/")) return { ok: false, error: "ឯកសារនេះមិនមែនជារូបភាពទេ" };
  if (photo.size > 4 * 1024 * 1024) return { ok: false, error: "រូបធំពេក សូមថតរូបអេក្រង់ម្តងទៀត" };

  const db = getAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, receipt_token, receipt_count, total, customer_name, phone")
    .eq("id", orderId)
    .maybeSingle();

  const valid =
    order?.receipt_token &&
    order.receipt_token.length === key.length &&
    timingSafeEqual(Buffer.from(order.receipt_token), Buffer.from(key));
  if (!order || !valid) return { ok: false, error: "រក order នេះមិនឃើញទេ" };
  if (order.receipt_count >= MAX_RECEIPTS) return { ok: false, error: "បានផ្ញើវិក្កយបត្រគ្រប់គ្រាន់ហើយ ហាងនឹងទាក់ទងអ្នកឆាប់ៗ" };

  const e = escapeHtml;
  const sent = await sendTelegramPhoto(
    process.env.TELEGRAM_ORDERS_CHAT_ID,
    photo,
    `🧾 <b>Order #${order.id} · បានបង់</b>\n💵 ${formatUSD(Number(order.total))}\n👤 ${e(order.customer_name)} · ${e(order.phone)}`,
  );
  if (!sent) return { ok: false, error: "ផ្ញើមិនបាន សូមព្យាយាមម្តងទៀត" };

  await db
    .from("orders")
    .update({ receipt_count: order.receipt_count + 1, receipt_at: new Date().toISOString(), receipt_message_id: sent })
    .eq("id", order.id);

  return { ok: true, data: null };
}
