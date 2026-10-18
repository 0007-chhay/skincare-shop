// ទិន្នន័យគំរូ — ជំហានទី ២ យើងនឹងប្តូរទៅយកពី Supabase ជំនួសវិញ
// តម្លៃខាងក្រោមគ្រាន់តែជាឧទាហរណ៍ សូមប្តូរជាតម្លៃពិត

export type Concern = "acne" | "dry" | "dark-spots" | "oily" | "sensitive";

export type Product = {
  slug: string;
  nameKm: string;
  nameEn: string;
  price: number; // USD
  description: string;
  tag?: string;
  tint: string; // ពណ៌ផ្ទៃខាងក្រោយ ពេលមិនទាន់មានរូបថត
  image?: string; // ឧ. "/products/vitamin-c.jpg"
  concerns: Concern[];
};

export const concerns: { id: Concern | "all"; label: string }[] = [
  { id: "all", label: "សម្រាប់អ្នក" },
  { id: "acne", label: "ស្បែកមុន" },
  { id: "dry", label: "ស្បែកស្ងួត" },
  { id: "dark-spots", label: "ស្នាមខ្មៅ" },
  { id: "oily", label: "ស្បែកខ្លាញ់" },
  { id: "sensitive", label: "ងាយរលាក" },
];

export const products: Product[] = [
  {
    slug: "vitamin-c-serum",
    nameKm: "សេរ៉ូមវីតាមីន C",
    nameEn: "Vitamin C Serum",
    price: 18,
    description: "ជួយឲ្យស្បែកភ្លឺថ្លា និងបន្ថយស្នាមខ្មៅ។",
    tag: "លក់ដាច់",
    tint: "#F3E6D3",
    concerns: ["dark-spots"],
  },
  {
    slug: "sunscreen-spf50",
    nameKm: "ឡេការពារកម្តៅថ្ងៃ SPF50",
    nameEn: "Sunscreen SPF50",
    price: 14,
    description: "ស្រាល មិនស្អិត ល្អសម្រាប់អាកាសធាតុក្តៅ។",
    tag: "ប្រើរាល់ថ្ងៃ",
    tint: "#D7EAE2",
    concerns: ["oily", "acne", "sensitive"],
  },
  {
    slug: "sheet-mask",
    nameKm: "ម៉ាសបិទមុខ",
    nameEn: "Sheet Mask",
    price: 3,
    description: "ផ្តល់សំណើមភ្លាមៗ ក្នុង ១៥ នាទី។",
    tag: "ថ្មី",
    tint: "#F2DEDE",
    concerns: ["dry"],
  },
  {
    slug: "hydrating-toner",
    nameKm: "ទឹកថ្នាំបំប៉នសំណើម",
    nameEn: "Hydrating Toner",
    price: 12,
    description: "រៀបចំស្បែកឲ្យស្រូបសេរ៉ូមបានល្អ។",
    tint: "#E3ECEA",
    concerns: ["dry", "sensitive"],
  },
  {
    slug: "gentle-cleanser",
    nameKm: "សាប៊ូលាងមុខស្រាល",
    nameEn: "Gentle Cleanser",
    price: 10,
    description: "សម្អាតជ្រៅ ដោយមិនធ្វើឲ្យស្បែកស្ងួត។",
    tint: "#ECE8F2",
    concerns: ["acne", "oily", "sensitive"],
  },
  {
    slug: "night-cream",
    nameKm: "ក្រែមលាបពេលយប់",
    nameEn: "Night Cream",
    price: 20,
    description: "បំប៉នស្បែកពេលអ្នកគេង។",
    tint: "#E6E2DC",
    concerns: ["dry"],
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}
