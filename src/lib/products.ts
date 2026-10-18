import { cache } from "react";
import type { Concern } from "./concerns";
import { productImageUrl, supabase } from "./supabase";

export { concernLabel, concerns, type Concern } from "./concerns";

// ផលិតផលទាំងអស់ឥឡូវនៅក្នុង Supabase (តារាង products)

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
  howToUse?: string;
  ingredients?: string;
  size?: string;
};


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
  how_to_use: string | null;
  ingredients: string | null;
  size: string | null;
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
    howToUse: row.how_to_use ?? undefined,
    ingredients: row.ingredients ?? undefined,
    size: row.size ?? undefined,
  };
}

// cache() = ទាញពី database តែម្តងក្នុងមួយ request ទោះហៅច្រើនដង
export const getProducts = cache(async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("slug, name_km, name_en, price, description, tag, tint, image, concerns, in_stock, how_to_use, ingredients, size")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`ទាញផលិតផលមិនបាន: ${error.message}`);
  return (data as ProductRow[]).map(toProduct);
});

export async function getProduct(slug: string) {
  const products = await getProducts();
  return products.find((p) => p.slug === slug);
}
