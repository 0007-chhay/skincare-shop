import type { Concern } from "./concerns";
import { getAdminClient } from "./supabase-admin";
import { productImageUrl } from "./supabase";

export type AdminProduct = {
  id: string;
  slug: string;
  name_km: string;
  name_en: string;
  price: number;
  description: string;
  tag: string | null;
  tint: string;
  image: string | null;
  imageUrl?: string;
  concerns: Concern[];
  in_stock: boolean;
  stock: number | null;
  is_active: boolean;
  sort_order: number;
  how_to_use: string | null;
  ingredients: string | null;
  size: string | null;
};

const columns =
  "id, slug, name_km, name_en, price, description, tag, tint, image, concerns, in_stock, stock, is_active, sort_order, how_to_use, ingredients, size";

function withUrl(row: AdminProduct): AdminProduct {
  return { ...row, price: Number(row.price), imageUrl: productImageUrl(row.image) };
}

// រួមទាំងផលិតផលដែលលាក់ផង
export async function listAllProducts() {
  const { data, error } = await getAdminClient()
    .from("products")
    .select(columns)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as AdminProduct[]).map(withUrl);
}

export async function getProductById(id: string) {
  const { data, error } = await getAdminClient().from("products").select(columns).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? withUrl(data as AdminProduct) : null;
}
