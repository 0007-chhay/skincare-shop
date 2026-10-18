import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ⚠️ ប្រើតែនៅលើ server (server actions) ប៉ុណ្ណោះ — Secret key មិនត្រូវទៅដល់ browser ទេ
let admin: SupabaseClient | null = null;

export function getAdminClient() {
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("ខ្វះ SUPABASE_SECRET_KEY — សូមដាក់ក្នុង .env.local និង Vercel (ប្រភេទ Secret)");
  }
  admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}
