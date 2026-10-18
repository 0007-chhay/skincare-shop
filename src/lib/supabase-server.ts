import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client ដែលស្គាល់អ្នក login (តាម cookie) — សម្រាប់ Admin
export async function createAuthClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // ហៅពី Server Component — middleware នឹង refresh session ជំនួស
          }
        },
      },
    },
  );
}
