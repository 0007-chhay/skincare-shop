import { formatUSD } from "./format";

export type PromoCode = {
  id: number;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  min_subtotal: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
};

export function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function describePromo(p: Pick<PromoCode, "kind" | "value" | "min_subtotal">) {
  const off = p.kind === "percent" ? `${Number(p.value)}%` : formatUSD(Number(p.value));
  return `បញ្ចុះ ${off}${Number(p.min_subtotal) > 0 ? ` · ទិញចាប់ពី ${formatUSD(Number(p.min_subtotal))}` : ""}`;
}

// ពិនិត្យកូដ (មិនរាប់ចំនួនប្រើទេ — សម្រាប់បង្ហាញមុនបញ្ជាទិញ)
export function evaluatePromo(p: PromoCode | null, subtotal: number): { ok: true; discount: number } | { ok: false; error: string } {
  if (!p || !p.is_active) return { ok: false, error: "កូដនេះមិនត្រឹមត្រូវ" };
  if (p.expires_at && new Date(p.expires_at) < new Date()) return { ok: false, error: "កូដនេះផុតកំណត់ហើយ" };
  if (p.max_uses !== null && p.used_count >= p.max_uses) return { ok: false, error: "កូដនេះត្រូវបានប្រើអស់ហើយ" };
  if (subtotal < Number(p.min_subtotal))
    return { ok: false, error: `កូដនេះប្រើបានពេលទិញចាប់ពី ${formatUSD(Number(p.min_subtotal))}` };
  const raw = p.kind === "percent" ? Math.round(subtotal * Number(p.value)) / 100 : Number(p.value);
  return { ok: true, discount: Math.min(raw, subtotal) };
}

export const promoErrors: Record<string, string> = {
  promo_invalid: "កូដនេះមិនត្រឹមត្រូវ",
  promo_expired: "កូដនេះផុតកំណត់ហើយ",
  promo_used_up: "កូដនេះត្រូវបានប្រើអស់ហើយ",
  promo_min_subtotal: "តម្លៃទិញមិនគ្រប់ចំនួនសម្រាប់កូដនេះ",
};
