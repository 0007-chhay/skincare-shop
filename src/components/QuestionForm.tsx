"use client";

import { useState, useTransition } from "react";
import { askQuestion } from "@/app/actions";

const inputClass =
  "h-12 w-full rounded-xl border-[1.5px] border-[#C3D6CD] bg-white px-3.5 text-base text-ink placeholder:text-[#8AA197] focus:border-leaf focus:outline-none";

export function QuestionForm({ productSlug, productName }: { productSlug?: string; productName?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await askQuestion({
        productSlug,
        productName,
        name: String(form.get("name") ?? ""),
        contact: String(form.get("contact") ?? ""),
        message: String(form.get("message") ?? ""),
        website: String(form.get("website") ?? ""),
      });
      if (res.ok) setSent(true);
      else setError(res.error);
    });
  }

  if (sent) {
    return (
      <div className="rounded-[20px] bg-white p-5 text-center">
        <p className="font-semibold">បានទទួលសំណួររបស់អ្នកហើយ</p>
        <p className="mt-1 text-sm leading-7 text-muted">ហាងនឹងទាក់ទងអ្នកវិញឆាប់ៗនេះ។</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-[20px] bg-white p-4">
      <h2 className="text-base font-semibold">មានសំណួរ? ទុកសារមកយើង</h2>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        ឈ្មោះ
        <input name="name" required maxLength={80} autoComplete="name" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        លេខទូរស័ព្ទ ឬ Telegram
        <input name="contact" required maxLength={60} placeholder="012 345 678 ឬ @username" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        សំណួរ
        <textarea
          name="message"
          required
          maxLength={1000}
          rows={3}
          placeholder="ឧ. ស្បែកខ្ញុំខ្លាញ់ ប្រើបានទេ?"
          className={`${inputClass} h-auto resize-none py-3`}
        />
      </label>
      {/* honeypot សម្រាប់ចាប់ spam bot */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {error && <p role="alert" className="text-sm text-[#A3261B]">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-2xl bg-ink text-[15px] font-semibold text-white disabled:opacity-60"
      >
        {pending ? "កំពុងផ្ញើ..." : "ផ្ញើសំណួរ"}
      </button>
    </form>
  );
}
