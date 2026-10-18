// កម្រិតស្តុក: ក្រហម = អស់ · លឿង = ជិតអស់ · ខៀវ = នៅច្រើន
export const LOW_STOCK = 5; // ≤ ៥ = ជិតអស់ (ប្តូរលេខនេះបាន)

export type StockLevel = "out" | "low" | "ok" | "untracked";

export function stockLevel(stock: number | null | undefined): StockLevel {
  if (stock === null || stock === undefined) return "untracked";
  if (stock <= 0) return "out";
  if (stock <= LOW_STOCK) return "low";
  return "ok";
}

export const stockStyle: Record<StockLevel, { label: string; badge: string; dot: string }> = {
  out: { label: "អស់ស្តុក", badge: "bg-[#FBE4E1] text-[#8A1C12]", dot: "bg-[#D93A2B]" },
  low: { label: "ជិតអស់", badge: "bg-[#FDF1C7] text-[#6B4A00]", dot: "bg-[#E8A800]" },
  ok: { label: "នៅច្រើន", badge: "bg-[#DCE8FA] text-[#163F7A]", dot: "bg-[#2563C9]" },
  untracked: { label: "មិនទាន់រាប់", badge: "bg-[#EEF1EF] text-[#4D6359]", dot: "bg-[#9AAFA5]" },
};
