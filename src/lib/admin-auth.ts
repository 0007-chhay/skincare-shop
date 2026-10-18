import { redirect } from "next/navigation";
import { createAuthClient } from "./supabase-server";

// មានតែ email ក្នុង ADMIN_EMAILS ទេដែលអាចចូល Admin បាន
export function isAdminEmail(email: string | undefined | null) {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

export async function getAdminUser() {
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  return data.user && isAdminEmail(data.user.email) ? data.user : null;
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
