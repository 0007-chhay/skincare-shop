"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPromo, deletePromo, setPromoActive } from "@/app/admin/actions";
import { describePromo, type PromoCode } from "@/lib/promo";

const input =
  "h-12 w-full rounded-xl border-[1.5px] border-[#C3D6CD] bg-white px-3.5 text-base text-ink placeholder:text-[#8AA197] focus:border-leaf focus:outline-none";
const label = "flex flex-col gap-1.5 text-sm font-medium";

function status(p: PromoCode): { text: string; cls: string } {
  if (!p.is_active) return { text: "បិទ", cls: "bg-[#EEF1EF] text-[#4D6359]" };
  if (p.expires_at && new Date(p.expires_at) < new Date()) return { text: "ផុតកំណត់", cls: "bg-[#FBE4E1] text-[#8A1C12]" };
  if (p.max_uses !== null && p.used_count >= p.max_uses) return { text: "ប្រើអស់", cls: "bg-[#FDF1C7] text-[#6B4A00]" };
  return { text: "កំពុងប្រើ", cls: "bg-[#D7EAE2] text-[#0B4A39]" };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("km-KH", { timeZone: "Asia/Phnom_Penh", day: "numeric", month: "short", year: "numeric" });
}

export function PromoManager({ promos }: { promos: PromoCode[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<"percent" | "fixed">("percent");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    form.set("kind", kind);
    setError(null);
    setCreated(null);
    startTransition(async () => {
      const res = await createPromo(form);
      if (res.ok) {
        setCreated(String(form.get("code")).toUpperCase());
        formEl.reset();
        router.refresh();
      } else setError(res.error);
    });
  }

  function onToggle(p: PromoCode) {
    startTransition(async () => {
      const res = await setPromoActive(p.id, !p.is_active);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  function onDelete(p: PromoCode) {
    const ok = window.confirm(
      `លុបកូដ "${p.code}" ជារៀងរហូតមែនទេ?\n\nមិនអាចយកមកវិញបានទេ។ បើគ្រាន់តែចង់ឈប់ប្រើ សូមចុច "បិទ" ជំនួសវិញ។`,
    );
    if (!ok) return;
    startTransition(async () => {
      const res = await deletePromo(p.id);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* បង្កើតកូដថ្មី */}
      <form onSubmit={onCreate} className="flex flex-col gap-3.5 rounded-2xl bg-white p-4">
        <h2 className="font-semibold">បង្កើតកូដថ្មី</h2>
        <label className={label}>
          កូដ
          <input name="code" required maxLength={30} autoCapitalize="characters" placeholder="ឧ. NEWYEAR10" className={`${input} uppercase`} />
        </label>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">ប្រភេទបញ្ចុះ</legend>
          <div className="grid grid-cols-2 gap-2">
            {([["percent", "ភាគរយ (%)"], ["fixed", "ទឹកប្រាក់ ($)"]] as const).map(([v, t]) => (
              <button
                key={v}
                type="button"
                aria-pressed={kind === v}
                onClick={() => setKind(v)}
                className={`h-12 rounded-xl text-[15px] ${kind === v ? "bg-ink text-white" : "border-[1.5px] border-[#C3D6CD] bg-white"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            {kind === "percent" ? "បញ្ចុះ (%)" : "បញ្ចុះ ($)"}
            <input name="value" required inputMode="decimal" placeholder={kind === "percent" ? "10" : "2.00"} className={input} />
          </label>
          <label className={label}>
            <span>ទិញចាប់ពី ($) <span className="font-normal text-muted">(មិនចាំបាច់)</span></span>
            <input name="min_subtotal" inputMode="decimal" placeholder="0" className={input} />
          </label>
          <label className={label}>
            <span>ប្រើបានប៉ុន្មានដង <span className="font-normal text-muted">(ទទេ = គ្មានកំណត់)</span></span>
            <input name="max_uses" inputMode="numeric" placeholder="ឧ. 50" className={input} />
          </label>
          <label className={label}>
            <span>ផុតកំណត់ <span className="font-normal text-muted">(មិនចាំបាច់)</span></span>
            <input name="expires_at" type="date" className={input} />
          </label>
        </div>

        {error && <p role="alert" className="rounded-xl bg-[#FBE4E1] p-3 text-sm text-[#7A1D14]">{error}</p>}
        {created && <p role="status" className="rounded-xl bg-[#D7EAE2] p-3 text-sm">បានបង្កើតកូដ <b>{created}</b> ✓</p>}

        <button type="submit" disabled={pending} className="h-12 rounded-2xl bg-leaf font-semibold text-white disabled:opacity-60">
          {pending ? "កំពុងបង្កើត..." : "បង្កើតកូដ"}
        </button>
      </form>

      {/* បញ្ជីកូដ */}
      <section className="flex flex-col gap-2.5">
        <h2 className="font-semibold">កូដទាំងអស់ ({promos.length})</h2>
        {promos.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-muted">មិនទាន់មានកូដទេ — បង្កើតកូដដំបូងនៅខាងលើ</p>}
        {promos.map((p) => {
          const st = status(p);
          return (
            <article key={p.id} className="rounded-2xl bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-lg font-bold tracking-wide">{p.code}</p>
                  <p className="text-sm text-muted">{describePromo(p)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>{st.text}</span>
              </div>
              <p className="mt-2 text-sm">
                បានប្រើ <b>{p.used_count}</b>{p.max_uses !== null ? ` / ${p.max_uses}` : ""} ដង
                {p.expires_at && <span className="text-muted"> · ផុតកំណត់ {fmtDate(p.expires_at)}</span>}
              </p>
              <div className="mt-2 flex gap-2 border-t border-line pt-2">
                <button type="button" onClick={() => onToggle(p)} disabled={pending} className="h-11 rounded-xl border-[1.5px] border-ink px-4 text-sm disabled:opacity-50">
                  {p.is_active ? "បិទ" : "បើកវិញ"}
                </button>
                <button type="button" onClick={() => onDelete(p)} disabled={pending} className="h-11 rounded-xl px-4 text-sm text-[#A3261B] disabled:opacity-50">
                  លុប
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
