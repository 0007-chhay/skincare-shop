import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "ខ្វះ NEXT_PUBLIC_SUPABASE_URL ឬ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — សូមដាក់ក្នុង .env.local (និងក្នុង Vercel)",
  );
}

// Key នេះជា "publishable" — អាចបង្ហាញជាសាធារណៈបាន ព្រោះ RLS ការពារទិន្នន័យ
export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

// បំប្លែងឈ្មោះរូបក្នុង Storage ទៅជា URL ពេញ
export function productImageUrl(image: string | null) {
  if (!image) return undefined;
  if (image.startsWith("http")) return image;
  return `${url}/storage/v1/object/public/products/${encodeURIComponent(image)}`;
}
