"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUser, isAdminEmail } from "@/lib/admin-auth";
import { concerns as concernList } from "@/lib/concerns";
import { getAdminClient } from "@/lib/supabase-admin";
import { createAuthClient } from "@/lib/supabase-server";

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };

const NOT_ALLOWED = { ok: false as const, error: "សូម login ម្តងទៀត" };

// បន្ទាប់ពីកែផលិតផល — ឲ្យហាងបង្ហាញទិន្នន័យថ្មីភ្លាម
function refreshShop() {
  revalidatePath("/", "layout");
}

// ───────────── Login / Logout ─────────────

export async function signIn(email: string, password: string): Promise<Result> {
  email = email.trim().toLowerCase();
  if (!email || !password) return { ok: false, error: "សូមបំពេញ email និង password" };

  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, error: "Email ឬ password មិនត្រឹមត្រូវ" };

  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut();
    return { ok: false, error: "Account នេះមិនមានសិទ្ធិចូល Admin ទេ" };
  }
  redirect("/admin/products");
}

export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ───────────── ផលិតផល ─────────────

const validConcerns = new Set(concernList.map((c) => c.id).filter((id) => id !== "all"));
const text = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);
const orNull = (s: string) => (s ? s : null);

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueSlug(base: string) {
  const db = getAdminClient();
  const root = base || `product-${Date.now().toString(36)}`;
  const { data } = await db.from("products").select("slug").like("slug", `${root}%`);
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(root)) return root;
  for (let i = 2; ; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`;
}

export async function saveProduct(form: FormData): Promise<Result<{ id: string }>> {
  if (!(await getAdminUser())) return NOT_ALLOWED;

  const id = text(form, "id", 60);
  const nameKm = text(form, "name_km", 120);
  const nameEn = text(form, "name_en", 120);
  const priceRaw = text(form, "price", 20).replace(/[$,\s]/g, "");
  const price = Number(priceRaw);
  const sortOrder = Math.trunc(Number(text(form, "sort_order", 10) || 0));
  const tint = text(form, "tint", 7);

  if (!nameKm) return { ok: false, error: "សូមបំពេញឈ្មោះខ្មែរ" };
  if (!priceRaw || !Number.isFinite(price) || price < 0 || price > 100000)
    return { ok: false, error: "តម្លៃមិនត្រឹមត្រូវ (ឧ. 12.50)" };

  const row: Record<string, unknown> = {
    name_km: nameKm,
    name_en: nameEn,
    price: Math.round(price * 100) / 100,
    size: orNull(text(form, "size", 40)),
    tag: orNull(text(form, "tag", 30)),
    description: text(form, "description", 1000),
    how_to_use: orNull(text(form, "how_to_use", 1500)),
    ingredients: orNull(text(form, "ingredients", 1500)),
    concerns: form.getAll("concerns").map(String).filter((c) => validConcerns.has(c as never)),
    in_stock: form.get("in_stock") === "on",
    is_active: form.get("is_active") === "on",
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
  if (/^#[0-9a-fA-F]{6}$/.test(tint)) row.tint = tint;

  const db = getAdminClient();

  // Upload រូប (បានបង្រួមទំហំរួចនៅក្នុង browser)
  const image = form.get("image");
  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) return { ok: false, error: "ឯកសារនេះមិនមែនជារូបភាពទេ" };
    if (image.size > 4 * 1024 * 1024) return { ok: false, error: "រូបធំពេក (លើស 4MB)" };
    const ext = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
    const base = slugify(nameEn) || "product";
    const path = `${base}-${Date.now().toString(36)}.${ext}`;
    const { error } = await db.storage.from("products").upload(path, image, { contentType: image.type });
    if (error) {
      console.error(error);
      return { ok: false, error: "Upload រូបមិនបាន សូមព្យាយាមម្តងទៀត" };
    }
    row.image = path;
  }

  if (id) {
    const { error } = await db.from("products").update(row).eq("id", id);
    if (error) {
      console.error(error);
      return { ok: false, error: "រក្សាទុកមិនបាន សូមព្យាយាមម្តងទៀត" };
    }
    refreshShop();
    return { ok: true, data: { id } };
  }

  row.slug = await uniqueSlug(slugify(nameEn));
  const { data, error } = await db.from("products").insert(row).select("id").single();
  if (error || !data) {
    console.error(error);
    return { ok: false, error: "បន្ថែមមិនបាន សូមព្យាយាមម្តងទៀត" };
  }
  refreshShop();
  return { ok: true, data: { id: data.id } };
}

export async function setProductFlag(
  id: string,
  flag: "in_stock" | "is_active",
  value: boolean,
): Promise<Result> {
  if (!(await getAdminUser())) return NOT_ALLOWED;
  if (flag !== "in_stock" && flag !== "is_active") return { ok: false, error: "មិនត្រឹមត្រូវ" };
  const { error } = await getAdminClient().from("products").update({ [flag]: value }).eq("id", id);
  if (error) return { ok: false, error: "រក្សាទុកមិនបាន" };
  refreshShop();
  return { ok: true, data: null };
}

// លុបជារៀងរហូត — ប៊ូតុងនៅលើទំព័រនឹងសួរបញ្ជាក់ជាមុនសិន
// (រូបភាពក្នុង Storage មិនត្រូវបានលុបទេ ដើម្បីសុវត្ថិភាព)
export async function deleteProduct(id: string): Promise<Result> {
  if (!(await getAdminUser())) return NOT_ALLOWED;
  const { error } = await getAdminClient().from("products").delete().eq("id", id);
  if (error) return { ok: false, error: "លុបមិនបាន" };
  refreshShop();
  return { ok: true, data: null };
}
