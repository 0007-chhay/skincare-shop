"use server";

import { formatUSD } from "@/lib/format";
import { DELIVERY_FEE, normalizePhone, paymentLabels, provinces, type PaymentMethod } from "@/lib/shop";
import { getAdminClient } from "@/lib/supabase-admin";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { escapeHtml, sendTelegram, sendTelegramPhoto } from "@/lib/telegram";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

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
  website?: string; // honeypot — មនុស្សមើលមិនឃើញ មានតែ bot ប៉ុណ្ណោះដែលបំពេញ
};

export async function placeOrder(input: OrderInput): Promise<Result<{ orderId: number; total: number; receiptKey: string }>> {
  if (input.website) return { ok: false, error: "មិនអាចបញ្ជាទិញបានទេ" };

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

  // រួមបញ្ចូលផលិតផលដដែលៗ និងពិនិត្យចំនួន
  const qtyBySlug = new Map<string, number>();
  for (const l of Array.isArray(input.lines) ? input.lines.slice(0, 50) : []) {
    const qty = Math.floor(Number(l?.qty));
    if (typeof l?.slug !== "string" || !Number.isFinite(qty) || qty < 1 || qty > 99) continue;
    qtyBySlug.set(l.slug, Math.min(99, (qtyBySlug.get(l.slug) ?? 0) + qty));
  }
  if (qtyBySlug.size === 0) return { ok: false, error: "កន្ត្រករបស់អ្នកនៅទទេ" };

  const db = getAdminClient();

  // យកតម្លៃពី database (មិនទុកចិត្តតម្លៃពី browser ទេ)
  const { data: rows, error: productError } = await db
    .from("products")
    .select("slug, name_km, price, in_stock, is_active")
    .in("slug", [...qtyBySlug.keys()]);
  if (productError) {
    console.error(productError);
    return { ok: false, error: "មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត" };
  }

  const items: { slug: string; name: string; price: number; qty: number }[] = [];
  for (const [slug, qty] of qtyBySlug) {
    const p = rows?.find((r) => r.slug === slug);
    if (!p || !p.is_active) return { ok: false, error: "ផលិតផលខ្លះមិនមានលក់ទៀតទេ សូមពិនិត្យកន្ត្រកម្តងទៀត" };
    if (!p.in_stock) return { ok: false, error: `${p.name_km} អស់ស្តុកហើយ សូមដកចេញពីកន្ត្រក` };
    items.push({ slug, name: p.name_km, price: Number(p.price), qty });
  }

  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
  const total = subtotal + DELIVERY_FEE;

  const receiptKey = randomBytes(12).toString("hex");

  const { data: order, error: insertError } = await db
    .from("orders")
    .insert({
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
      delivery_fee: DELIVERY_FEE,
      total,
    })
    .select("id")
    .single();
  if (insertError || !order) {
    console.error(insertError);
    return { ok: false, error: "មិនអាចរក្សាទុក order បានទេ សូមព្យាយាមម្តងទៀត" };
  }

  // ជូនដំណឹងទៅក្រុម Order (បើផ្ញើមិនបាន order នៅតែរក្សាទុកក្នុង database)
  const e = escapeHtml;
  const lines = [
    `🛍 <b>Order ថ្មី #${order.id}</b>`,
    "",
    `👤 ${e(name)} · <a href="tel:${phone}">${phone}</a>`,
    telegram ? `✈️ <a href="https://t.me/${e(telegram)}">@${e(telegram)}</a>` : null,
    `📍 ${e(province)} · ${e(address)}`,
    mapLink ? `🗺 <a href="${e(mapLink)}">មើលទីតាំង</a>` : null,
    "",
    ...items.map((i) => `• ${e(i.name)} × ${i.qty} = ${formatUSD(i.price * i.qty)}`),
    "",
    `💵 <b>សរុប ${formatUSD(total)}</b> · ${e(paymentLabels[payment])}`,
    note ? `📝 ${e(note)}` : null,
  ].filter((l) => l !== null);
  await sendTelegram(process.env.TELEGRAM_ORDERS_CHAT_ID, lines.join("\n"));

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
    `🧾 <b>វិក្កយបត្រ Order #${order.id}</b>\n💵 ${formatUSD(Number(order.total))}\n👤 ${e(order.customer_name)} · ${e(order.phone)}`,
  );
  if (!sent) return { ok: false, error: "ផ្ញើមិនបាន សូមព្យាយាមម្តងទៀត" };

  await db
    .from("orders")
    .update({ receipt_count: order.receipt_count + 1, receipt_at: new Date().toISOString() })
    .eq("id", order.id);

  return { ok: true, data: null };
}
