"use client";

import { useState, useTransition } from "react";
import { uploadReceipt } from "@/app/actions";
import { shrinkImage } from "@/lib/shrink-image";

export function ReceiptUpload({ orderNo, receiptKey, onSent }: { orderNo: string; receiptKey: string; onSent?: () => void }) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPreparing(true);
    const small = await shrinkImage(file);
    setPreparing(false);
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(small);
    setPreview(URL.createObjectURL(small));
  }

  function onSend() {
    if (!photo) return;
    const form = new FormData();
    form.set("no", orderNo);
    form.set("k", receiptKey);
    form.set("photo", photo);
    setError(null);
    startTransition(async () => {
      const res = await uploadReceipt(form);
      if (res.ok) {
        if (onSent) onSent();
        else setSent(true);
      }
      else setError(res.error);
    });
  }

  if (sent) {
    return (
      <p role="status" className="w-full rounded-2xl bg-[#D7EAE2] p-4 text-sm leading-7">
        បានផ្ញើវិក្កយបត្រហើយ ✓<br />ហាងនឹងពិនិត្យ ហើយបញ្ជាក់ order របស់អ្នកឆាប់ៗនេះ។
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="វិក្កយបត្រដែលបានជ្រើស" className="mx-auto max-h-64 rounded-xl border border-line" />
      )}
      <input id="receipt-picker" type="file" accept="image/*" onChange={onPick} className="sr-only" />
      <label
        htmlFor="receipt-picker"
        className="flex h-12 cursor-pointer items-center justify-center rounded-2xl border-[1.5px] border-dashed border-leaf text-[15px] text-leaf"
      >
        {preparing ? "កំពុងរៀបចំរូប..." : preview ? "ប្តូររូប" : "ជ្រើសរូបវិក្កយបត្រ"}
      </label>
      {error && <p role="alert" className="text-sm text-[#A3261B]">{error}</p>}
      <button
        type="button"
        onClick={onSend}
        disabled={!photo || pending || preparing}
        className="h-12 rounded-2xl bg-leaf font-semibold text-white disabled:opacity-50"
      >
        {pending ? "កំពុងផ្ញើ..." : "ផ្ញើវិក្កយបត្រ"}
      </button>
    </div>
  );
}
