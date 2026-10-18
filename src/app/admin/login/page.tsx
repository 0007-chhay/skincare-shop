"use client";

import { useState, useTransition } from "react";
import { signIn } from "../actions";

const inputClass =
  "h-[50px] w-full rounded-xl border-[1.5px] border-[#C3D6CD] bg-white px-3.5 text-base text-ink focus:border-leaf focus:outline-none";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await signIn(String(f.get("email") ?? ""), String(f.get("password") ?? ""));
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="font-display text-2xl font-bold">ចូលគ្រប់គ្រងហាង</h1>
        <p className="mt-1 text-sm text-muted">សម្រាប់ម្ចាស់ហាងប៉ុណ្ណោះ</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Email
          <input name="email" type="email" required autoComplete="email" inputMode="email" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Password
          <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
        </label>
        {error && <p role="alert" className="text-sm text-[#A3261B]">{error}</p>}
        <button type="submit" disabled={pending} className="mt-1 h-[50px] rounded-2xl bg-ink font-semibold text-white disabled:opacity-60">
          {pending ? "កំពុងចូល..." : "ចូល"}
        </button>
      </form>
    </main>
  );
}
