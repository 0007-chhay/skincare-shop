import { cache } from "react";
import { productImageUrl, supabase } from "./supabase";

// ផលិតផលទាំងអស់ឥឡូវនៅក្នុង Supabase (តារាង products)

export type Concern = "acne" | "dry" | "dark-spots" | "oily" | "sensitive";

export type Product = {
  slug: string;
  nameKm: string;
  nameEn: string;
  price: number; // USD
  description: string;
  tag?: string;
  tint: string; // ពណ៌ផ្ទៃខាងក្រោយ ពេលមិនទាន់មានរូបថត
  image?: string; // URL រូបពី Supabase Storage
  concerns: Concern[];
  inStock: boolean;
};

export const concerns: { id: Concern | "all"; label: string }[] = [
  { id: "all", label: "សម្រាប់អ្នក" },
  { id: "acne", label: "ស្បែកមុន" },
  { id: "dry", label: "ស្បែកស្ងួត" },
  { id: "dark-spots", label: "ស្នាមខ្មៅ" },
  { id: "oily", label: "ស្បែកខ្លាញ់" },
  { id: "sensitive", label: "ងាយរលាក" },
];

type ProductRow = {
  slug: string;
  name_km: string;
  name_en: string;
  price: number | string;
  description: string;
  tag: string | null;
  tint: string;
  image: string | null;
  concerns: string[];
  in_stock: boolean;
};

function toProduct(row: ProductRow): Product {
  return {
    slug: row.slug,
    nameKm: row.name_km,
    nameEn: row.name_en,
    price: Number(row.price),
    description: row.description,
    tag: row.tag ?? undefined,
    tint: row.tint,
    image: productImageUrl(row.image),
    concerns: row.concerns as Concern[],
    inStock: row.in_stock,
  };
}

// cache() = ទាញពី database តែម្តងក្នុងមួយ request ទោះហៅច្រើនដង
export const getProducts = cache(async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("slug, name_km, name_en, price, description, tag, tint, image, concerns, in_stock")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`ទាញផលិតផលមិនបាន: ${error.message}`);
  return (data as ProductRow[]).map(toProduct);
});
