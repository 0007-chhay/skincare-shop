import { productImageUrl } from "./supabase";

// រូប KHQR របស់ហាង — upload ទៅ Supabase → Storage → products ដាក់ឈ្មោះ khqr.jpg
// (ឬប្តូរឈ្មោះតាម NEXT_PUBLIC_KHQR_IMAGE)
export const khqr = {
  imageUrl: productImageUrl(process.env.NEXT_PUBLIC_KHQR_IMAGE ?? "khqr.jpg"),
  accountName: process.env.NEXT_PUBLIC_KHQR_ACCOUNT_NAME ?? "", // ឧ. CHHAY SREYLAK (មិនចាំបាច់)
};
