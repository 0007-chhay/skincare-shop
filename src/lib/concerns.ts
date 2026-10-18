// បញ្ហាស្បែក — ឯកសារនេះគ្មាន database ដូច្នេះប្រើក្នុង browser បាន

export type Concern = "acne" | "dry" | "dark-spots" | "oily" | "sensitive";

export const concerns: { id: Concern | "all"; label: string }[] = [
  { id: "all", label: "សម្រាប់អ្នក" },
  { id: "acne", label: "ស្បែកមុន" },
  { id: "dry", label: "ស្បែកស្ងួត" },
  { id: "dark-spots", label: "ស្នាមខ្មៅ" },
  { id: "oily", label: "ស្បែកខ្លាញ់" },
  { id: "sensitive", label: "ងាយរលាក" },
];

export function concernLabel(id: Concern) {
  return concerns.find((c) => c.id === id)?.label ?? id;
}
