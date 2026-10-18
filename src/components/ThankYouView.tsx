"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatUSD } from "@/lib/format";
import { ReceiptUpload } from "./ReceiptUpload";

export type ReceiptOrder = {
  createdAt: string;
  customerName: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  discount: number;
  promoCode: string | null;
};

type Contact = { name: string; telegram: string | null; tiktok: string | null; phone: string | null };

type Props = {
  orderNo: string | null;
  total: number | null;
  isKhqr: boolean;
  receiptKey: string | null;
  qrUrl?: string;
  accountName: string;
  order: ReceiptOrder | null;
  contact: Contact;
};

// ───────── icons ─────────
const PlaneIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path d="M21 4L3 11l6 2 2 6 3-4 5 4z" strokeLinejoin="round" />
  </svg>
);
const NoteIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5H12" strokeLinecap="round" />
    <path d="M14 4c.5 2.5 2.5 4 5 4" strokeLinecap="round" />
  </svg>
);
const Sparkle = ({ className }: { className: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 0c.6 5.6 2.8 8.4 8.4 9-5.6.6-7.8 2.8-8.4 8.4C11.4 11.8 9.2 9.6 3.6 9 9.2 8.4 11.4 5.6 12 0z" />
  </svg>
);

function when(iso: string) {
  return new Date(iso).toLocaleString("km-KH", {
    timeZone: "Asia/Phnom_Penh",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ───────── កាតវិក្កយបត្រ (សម្រាប់ថតអេក្រង់) ─────────
function ReceiptCard({ orderNo, total, isKhqr, order, contact }: Pick<Props, "orderNo" | "total" | "isKhqr" | "order" | "contact">) {
  return (
    <article className="relative w-full overflow-hidden rounded-[28px] bg-white text-left shadow-[0_14px_40px_rgba(158,59,84,0.16)]">
      {/* ក្បាល */}
      <header className="relative overflow-hidden bg-[linear-gradient(135deg,#F7C6D2_0%,#FBE1D7_55%,#D3EBDF_100%)] px-6 pb-8 pt-7 text-center">
        <Sparkle className="absolute left-5 top-5 size-5 text-white/90" />
        <Sparkle className="absolute right-7 top-10 size-3 text-white/90" />
        <Sparkle className="absolute bottom-6 left-10 size-3 text-white/80" />
        <Sparkle className="absolute bottom-4 right-6 size-6 text-white/70" />
        <p className="text-xs font-semibold tracking-[0.2em] text-[#9E3B54]/80">{contact.name}</p>
        <h1 className="mt-2 font-display text-[28px] font-bold leading-snug text-[#5A1F31]">អរគុណច្រើន! 💕</h1>
        <p className="mt-1 text-sm text-[#7A3346]">
          {isKhqr ? "យើងបានទទួលវិក្កយបត្ររបស់អ្នកហើយ" : "យើងបានទទួល order របស់អ្នកហើយ"}
        </p>
      </header>

      {/* រន្ធកាត */}
      <div className="relative h-6" aria-hidden="true">
        <span className="absolute -left-3 top-0 size-6 rounded-full bg-[#FFF5F3]" />
        <span className="absolute -right-3 top-0 size-6 rounded-full bg-[#FFF5F3]" />
        <span className="absolute inset-x-6 top-1/2 border-t-2 border-dashed border-[#F1D5DB]" />
      </div>

      <div className="flex flex-col gap-4 px-6 pb-6">
        {/* លេខកូដ */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-[#9A7A82]">លេខកូដ Order</p>
            <p className="font-mono text-4xl font-bold tracking-wider text-[#5A1F31]">#{orderNo ?? "—"}</p>
          </div>
          <span className="mb-1 rounded-full bg-[#E3F2EA] px-3 py-1 text-xs font-semibold text-[#0B5A45]">
            {isKhqr ? "✓ បានផ្ញើវិក្កយបត្រ" : "បង់ពេលទទួល"}
          </span>
        </div>
        {order && (
          <p className="-mt-2 text-xs leading-5 text-[#9A7A82]">
            {order.customerName} · {when(order.createdAt)}
          </p>
        )}

        {/* ទំនិញ */}
        {order && order.items.length > 0 && (
          <ul className="flex flex-col gap-2 rounded-2xl bg-[#FFF5F3] p-4 text-sm">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-3">
                <span className="text-[#5A1F31]">
                  {i.name} <span className="text-[#9A7A82]">× {i.qty}</span>
                </span>
                <span className="whitespace-nowrap text-[#5A1F31]">{formatUSD(i.price * i.qty)}</span>
              </li>
            ))}
            {order.discount > 0 && (
              <li className="flex justify-between gap-3 text-[#0B5A45]">
                <span>🎟 {order.promoCode ?? "បញ្ចុះតម្លៃ"}</span>
                <span>−{formatUSD(order.discount)}</span>
              </li>
            )}
            <li className="flex justify-between gap-3 text-[#9A7A82]">
              <span>ដឹកជញ្ជូន</span>
              <span>ឥតគិតថ្លៃ</span>
            </li>
          </ul>
        )}

        {/* សរុប */}
        <div className="flex items-center justify-between rounded-2xl bg-[#5A1F31] px-5 py-3.5 text-white">
          <span className="text-sm">សរុប</span>
          <span className="text-2xl font-bold">{total !== null ? formatUSD(total) : "—"}</span>
        </div>

        {/* បន្ទាប់មក */}
        <ol className="flex flex-col gap-1.5 text-sm text-[#7A5A62]">
          {(isKhqr
            ? ["ហាងពិនិត្យការបង់ប្រាក់", "រៀបចំ និងផ្ញើទំនិញទៅអ្នក", "ក្រុមហ៊ុនដឹកទាក់ទងអ្នកតាមទូរស័ព្ទ"]
            : ["ហាងទាក់ទងអ្នកដើម្បីបញ្ជាក់", "រៀបចំ និងផ្ញើទំនិញទៅអ្នក", "បង់ប្រាក់ពេលទទួលទំនិញ"]
          ).map((step, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#FCE4EA] text-xs font-bold text-[#9E3B54]">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>

        {/* ទាក់ទង (ឃើញក្នុងរូបអេក្រង់) */}
        {(contact.telegram || contact.tiktok || contact.phone) && (
          <div className="flex flex-wrap justify-center gap-2 border-t border-dashed border-[#F1D5DB] pt-4 text-xs text-[#7A3346]">
            {contact.telegram && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#EAF6FC] px-3 py-1.5"><PlaneIcon className="size-3.5" />@{contact.telegram}</span>
            )}
            {contact.tiktok && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#F3EEF9] px-3 py-1.5"><NoteIcon className="size-3.5" />@{contact.tiktok}</span>
            )}
            {contact.phone && <span className="rounded-full bg-[#FFF1E8] px-3 py-1.5">📞 {contact.phone}</span>}
          </div>
        )}
        <p className="text-center text-xs text-[#B08A93]">✨ សូមអរគុណដែលបានគាំទ្រហាងតូចរបស់យើង ✨</p>
      </div>
    </article>
  );
}

// ───────── ប៊ូតុងទាក់ទង ─────────
function ContactButtons({ orderNo, total, contact }: { orderNo: string | null; total: number | null; contact: Contact }) {
  const msg = `សួស្តី! ខ្ញុំសួរអំពី Order #${orderNo ?? ""}${total !== null ? ` (${formatUSD(total)})` : ""}`;
  if (!contact.telegram && !contact.tiktok && !contact.phone) return null;
  return (
    <div className="grid w-full gap-2">
      {contact.telegram && (
        <a
          href={`https://t.me/${contact.telegram}?text=${encodeURIComponent(msg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#1C8ACB] font-semibold text-white"
        >
          <PlaneIcon className="size-5" /> សួរតាម Telegram
        </a>
      )}
      <div className="grid grid-cols-2 gap-2">
        {contact.tiktok && (
          <a
            href={`https://www.tiktok.com/@${contact.tiktok}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] font-semibold text-white ${contact.phone ? "" : "col-span-2"}`}
          >
            <NoteIcon className="size-5" /> TikTok
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className={`flex h-12 items-center justify-center rounded-2xl border-[1.5px] border-[#5A1F31] font-semibold text-[#5A1F31] ${contact.tiktok ? "" : "col-span-2"}`}>
            📞 ហៅហាង
          </a>
        )}
      </div>
    </div>
  );
}

function CopyCode({ orderNo }: { orderNo: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`#${orderNo}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {}
      }}
      className="h-12 w-full rounded-2xl bg-white font-semibold text-[#5A1F31] shadow-sm"
    >
      {copied ? "✓ បានចម្លងលេខកូដ" : `ចម្លងលេខកូដ #${orderNo}`}
    </button>
  );
}

export function ThankYouView(p: Props) {
  const storageKey = p.orderNo ? `receipt-sent-${p.orderNo}` : null;
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      if (storageKey && localStorage.getItem(storageKey)) setSent(true);
    } catch {}
  }, [storageKey]);

  function onSent() {
    try {
      if (storageKey) localStorage.setItem(storageKey, "1");
    } catch {}
    setSent(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ✅ រួចរាល់ — កាតស្អាតសម្រាប់ថតអេក្រង់
  if (!p.isKhqr || sent) {
    return (
      <main className="min-h-dvh bg-[#FFF5F3]">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-8">
          <ReceiptCard orderNo={p.orderNo} total={p.total} isKhqr={p.isKhqr} order={p.order} contact={p.contact} />
          <p className="rounded-full bg-white px-4 py-2 text-xs text-[#7A3346] shadow-sm">📸 ថតរូបអេក្រង់កាតនេះទុក ជាភស្តុតាង</p>
          {p.orderNo && <CopyCode orderNo={p.orderNo} />}
          <ContactButtons orderNo={p.orderNo} total={p.total} contact={p.contact} />
          <Link href="/" className="flex h-12 w-full items-center justify-center rounded-2xl border-[1.5px] border-[#5A1F31] font-semibold text-[#5A1F31]">
            ត្រឡប់ទៅហាងវិញ
          </Link>
        </div>
      </main>
    );
  }

  // ⏳ បង់ប្រាក់តាម KHQR
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-5 px-5 py-10 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">អរគុណសម្រាប់ការបញ្ជាទិញ!</h1>
        {p.orderNo && <p className="mt-1 text-muted">លេខ order របស់អ្នក: <b className="text-ink">#{p.orderNo}</b></p>}
      </div>

      <section className="flex w-full flex-col items-center gap-4 rounded-3xl bg-white p-5">
        <h2 className="text-lg font-semibold">បង់ប្រាក់តាម KHQR</h2>
        {p.total !== null && <p className="text-3xl font-bold">{formatUSD(p.total)}</p>}
        {p.qrUrl && (
          <div className="w-full max-w-[280px] overflow-hidden rounded-2xl border border-line">
            <Image src={p.qrUrl} alt="KHQR សម្រាប់បង់ប្រាក់" width={560} height={760} className="h-auto w-full" priority />
          </div>
        )}
        {p.accountName && <p className="text-sm text-muted">ឈ្មោះគណនី: <b className="text-ink">{p.accountName}</b></p>}
        <ol className="flex w-full flex-col gap-2 rounded-2xl bg-mint p-4 text-left text-sm leading-7">
          <li>១. ស្កេន QR ដោយកម្មវិធីធនាគារណាមួយ (ABA, ACLEDA, Wing ...)</li>
          <li>
            ២. បញ្ចូលចំនួនទឹកប្រាក់{p.total !== null && <> <b>{formatUSD(p.total)}</b></>}
            {p.orderNo && <> ហើយសរសេរ <b>#{p.orderNo}</b> ក្នុងកំណត់ចំណាំ</>}
          </li>
          <li>៣. ថតរូបអេក្រង់វិក្កយបត្រ ហើយផ្ញើនៅខាងក្រោម</li>
        </ol>
        <p className="text-xs leading-6 text-muted">
          បើបើកនៅលើទូរស័ព្ទ: ថតរូបអេក្រង់ ឬចុចឲ្យជាប់លើ QR ដើម្បីរក្សាទុក រួចជ្រើស “ស្កេនពីរូបភាព” ក្នុងកម្មវិធីធនាគារ។
        </p>
        {p.orderNo && p.receiptKey && <ReceiptUpload orderNo={p.orderNo} receiptKey={p.receiptKey} onSent={onSent} />}
      </section>

      <p className="text-sm text-muted">មានបញ្ហាពេលបង់ប្រាក់?</p>
      <ContactButtons orderNo={p.orderNo} total={p.total} contact={p.contact} />

      <Link href="/" className="flex h-12 items-center rounded-2xl border-[1.5px] border-ink px-8 font-semibold">
        ត្រឡប់ទៅហាងវិញ
      </Link>
    </main>
  );
}
