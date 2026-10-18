import { PromoManager } from "@/components/admin/PromoManager";
import type { PromoCode } from "@/lib/promo";
import { getAdminClient } from "@/lib/supabase-admin";

export default async function AdminPromosPage() {
  const { data, error } = await getAdminClient()
    .from("promo_codes")
    .select("id, code, kind, value, min_subtotal, max_uses, used_count, expires_at, is_active")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (
    <>
      <h1 className="mb-4 text-xl font-bold">កូដបញ្ចុះតម្លៃ</h1>
      <PromoManager promos={(data ?? []) as PromoCode[]} />
    </>
  );
}
