import { timingSafeEqual } from "node:crypto";
import { ThankYouView, type ReceiptOrder } from "@/components/ThankYouView";
import { shopContact } from "@/lib/contact";
import { khqr } from "@/lib/payment";
import { getAdminClient } from "@/lib/supabase-admin";

type Props = { searchParams: Promise<{ no?: string; pm?: string; t?: string; k?: string }> };

export const metadata = { title: "អរគុណ" };

// ទាញ order ពិត (តែពេលលេខកូដសម្ងាត់ត្រឹមត្រូវ) ដើម្បីបង្ហាញលើកាតវិក្កយបត្រ
async function loadOrder(no: string | null, key: string | null): Promise<ReceiptOrder | null> {
  if (!no || !key) return null;
  try {
    const { data } = await getAdminClient()
      .from("orders")
      .select("id, created_at, customer_name, items, total, discount, promo_code, payment_method, receipt_token")
      .eq("id", Number(no))
      .maybeSingle();
    if (!data?.receipt_token || data.receipt_token.length !== key.length) return null;
    if (!timingSafeEqual(Buffer.from(data.receipt_token), Buffer.from(key))) return null;
    return {
      createdAt: data.created_at,
      customerName: data.customer_name,
      items: (data.items ?? []).map((i: { name: string; qty: number; price: number }) => ({ name: i.name, qty: i.qty, price: Number(i.price) })),
      total: Number(data.total),
      discount: Number(data.discount ?? 0),
      promoCode: data.promo_code,
    };
  } catch {
    return null;
  }
}

export default async function ThankYouPage({ searchParams }: Props) {
  const { no, pm, t, k } = await searchParams;
  const orderNo = /^\d+$/.test(no ?? "") ? no! : null;
  const receiptKey = /^[0-9a-f]{24}$/.test(k ?? "") ? k! : null;
  const order = await loadOrder(orderNo, receiptKey);

  return (
    <ThankYouView
      orderNo={orderNo}
      total={order?.total ?? (/^\d+(\.\d{1,2})?$/.test(t ?? "") ? Number(t) : null)}
      isKhqr={pm === "khqr"}
      receiptKey={receiptKey}
      qrUrl={khqr.imageUrl}
      accountName={khqr.accountName}
      order={order}
      contact={shopContact}
    />
  );
}
