"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { checkPromo, placeOrder } from "@/app/actions";
import { BackIcon } from "@/components/icons";
import { useCart } from "@/lib/cart";
import { formatUSD, toKhmerNumber } from "@/lib/format";
import { DELIVERY_FEE, provinces, type PaymentMethod } from "@/lib/shop";

const inputClass =
  "h-[50px] w-full rounded-xl border-[1.5px] border-[#C3D6CD] bg-white px-3.5 text-base text-ink placeholder:text-[#8AA197] focus:border-leaf focus:outline-none";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, count, subtotal, clear } = useCart();
  const [payment, setPayment] = useState<PaymentMethod>("khqr");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checkingPromo, startPromo] = useTransition();
  const discount = promo?.discount ?? 0;
  const total = Math.max(0, subtotal - discount) + DELIVERY_FEE;

  function applyPromo() {
    setPromoError(null);
    startPromo(async () => {
      const res = await checkPromo(promoInput, items.map((i) => ({ slug: i.slug, qty: i.qty })));
      if (res.ok) {
        setPromo(res.data);
        setPromoInput(res.data.code);
      } else {
        setPromo(null);
        setPromoError(res.error);
      }
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await placeOrder({
        lines: items.map((i) => ({ slug: i.slug, qty: i.qty })),
        name: String(f.get("name") ?? ""),
        phone: String(f.get("phone") ?? ""),
        telegram: String(f.get("telegram") ?? ""),
        province: String(f.get("province") ?? ""),
        address: String(f.get("address") ?? ""),
        mapLink: String(f.get("mapLink") ?? ""),
        note: String(f.get("note") ?? ""),
        website: String(f.get("website") ?? ""),
        payment,
        promoCode: promo?.code,
      });
      if (res.ok) {
        setDone(true);
        router.replace(`/thank-you?no=${res.data.orderId}&pm=${payment}&t=${res.data.total.toFixed(2)}&k=${res.data.receiptKey}`);
        clear();
      } else {
        setError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  if (items.length === 0 && !pending && !done) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted">កន្ត្រករបស់អ្នកនៅទទេ។</p>
        <Link href="/" className="rounded-2xl bg-leaf px-6 py-3 font-semibold text-white">មើលផលិតផល</Link>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <header className="flex items-center gap-2 px-4 py-3">
        <Link href="/cart" aria-label="ត្រឡប់ក្រោយ" className="grid size-11 place-items-center">
          <BackIcon className="size-6" />
        </Link>
        <h1 className="font-display text-[22px] font-bold">ព័ត៌មានដឹកជញ្ជូន</h1>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5 px-4 pb-36">
        {error && (
          <p role="alert" className="rounded-2xl bg-[#FBE4E1] p-4 text-sm leading-6 text-[#7A1D14]">{error}</p>
        )}

        <section className="flex flex-col gap-3.5 rounded-[20px] bg-white p-4">
          <label className={labelClass}>
            ឈ្មោះ
            <input name="name" required maxLength={80} autoComplete="name" className={inputClass} />
          </label>
          <label className={labelClass}>
            លេខទូរស័ព្ទ
            <input name="phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="012 345 678" className={inputClass} />
          </label>
          <label className={labelClass}>
            <span>Telegram <span className="font-normal text-muted">(មិនចាំបាច់)</span></span>
            <input name="telegram" maxLength={40} placeholder="@username" className={inputClass} />
          </label>
        </section>

        <section className="flex flex-col gap-3.5 rounded-[20px] bg-white p-4">
          <h2 className="text-base font-semibold">ទីតាំងដឹកជញ្ជូន</h2>
          <label className={labelClass}>
            រាជធានី / ខេត្ត
            <select name="province" required defaultValue="" className={inputClass}>
              <option value="" disabled>ជ្រើសរើស...</option>
              {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            អាសយដ្ឋានលម្អិត
            <textarea name="address" required minLength={5} maxLength={300} rows={3} placeholder="ផ្ទះលេខ ផ្លូវ ភូមិ សង្កាត់..." className={`${inputClass} h-auto resize-none py-3`} />
          </label>
          <label className={labelClass}>
            <span>Link ទីតាំង Google Maps <span className="font-normal text-muted">(មិនចាំបាច់)</span></span>
            <input name="mapLink" type="url" maxLength={300} placeholder="https://maps.app.goo.gl/..." className={inputClass} />
          </label>
        </section>

        <fieldset className="flex flex-col gap-2.5 rounded-[20px] bg-white p-4">
          <legend className="float-left mb-1 text-base font-semibold">វិធីបង់ប្រាក់</legend>
          {([
            ["khqr", "KHQR", "ស្កេន QR ក្រោយបញ្ជាទិញ · ABA, ACLEDA, Wing ..."],
            ["cod", "បង់ពេលទទួលទំនិញ", null],
          ] as const).map(([value, title, sub]) => (
            <label
              key={value}
              className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-2 ${payment === value ? "border-2 border-ink" : "border-[1.5px] border-[#C3D6CD]"}`}
            >
              <input type="radio" name="payment" value={value} checked={payment === value} onChange={() => setPayment(value)} className="size-5 accent-leaf" />
              <span className="flex flex-col">
                <span className="text-[15px] font-semibold">{title}</span>
                {sub && <span className="text-xs text-muted">{sub}</span>}
              </span>
            </label>
          ))}
        </fieldset>

        <section className="flex flex-col gap-2 rounded-[20px] bg-white p-4">
          <label htmlFor="promo" className="text-base font-semibold">កូដបញ្ចុះតម្លៃ</label>
          <div className="flex gap-2">
            <input
              id="promo"
              value={promoInput}
              onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); if (promo) setPromo(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } }}
              maxLength={30}
              autoCapitalize="characters"
              placeholder="ឧ. NEWYEAR10"
              className={`${inputClass} uppercase`}
            />
            <button
              type="button"
              onClick={applyPromo}
              disabled={checkingPromo || promoInput.trim().length < 3}
              className="h-[50px] shrink-0 rounded-xl bg-ink px-5 text-[15px] font-semibold text-white disabled:opacity-40"
            >
              {checkingPromo ? "..." : "ប្រើ"}
            </button>
          </div>
          {promo && <p role="status" className="text-sm text-leaf">✓ កូដ {promo.code} · បញ្ចុះ {formatUSD(promo.discount)}</p>}
          {promoError && <p role="alert" className="text-sm text-[#A3261B]">{promoError}</p>}
        </section>

        <section className="flex flex-col gap-2 rounded-[20px] bg-white p-4 text-[15px]">
          <h2 className="mb-1 text-base font-semibold">ការបញ្ជាទិញរបស់អ្នក</h2>
          {items.map((i) => (
            <div key={i.slug} className="flex justify-between gap-3">
              <span>{i.product.nameKm} × {i.qty}</span>
              <span className="whitespace-nowrap">{formatUSD(i.product.price * i.qty)}</span>
            </div>
          ))}
          {discount > 0 && (
            <div className="flex justify-between text-leaf"><span>បញ្ចុះតម្លៃ ({promo?.code})</span><span>−{formatUSD(discount)}</span></div>
          )}
          <div className="flex justify-between text-muted"><span>ដឹកជញ្ជូន</span><span>ឥតគិតថ្លៃ</span></div>
          <div className="my-1 h-px bg-line" />
          <div className="flex justify-between text-lg font-semibold"><span>សរុប</span><span>{formatUSD(total)}</span></div>
        </section>

        <label className={labelClass}>
          <span>កំណត់ចំណាំ <span className="font-normal text-muted">(មិនចាំបាច់)</span></span>
          <input name="note" maxLength={300} placeholder="ឧ. ដឹកក្រោយម៉ោង ៥ល្ងាច" className={inputClass} />
        </label>

        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

        <div className="fixed inset-x-0 bottom-0 z-30 bg-ink pb-[max(env(safe-area-inset-bottom),16px)] text-white">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 pt-3">
            <div>
              <p className="text-[13px] text-[#B5CEC4]">សរុប · {toKhmerNumber(count)} មុខ · ដឹកឥតគិតថ្លៃ</p>
              <p className="text-lg font-semibold">{formatUSD(total)}</p>
            </div>
            <button type="submit" disabled={pending} className="h-[50px] rounded-2xl bg-white px-6 font-semibold text-ink disabled:opacity-60">
              {pending ? "កំពុងបញ្ជាទិញ..." : "បញ្ជាទិញ"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
