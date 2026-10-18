import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminClient } from "@/lib/supabase-admin";
import { signOut } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const { count: pendingOrders } = await getAdminClient()
    .from("orders")
    .select("id", { count: "exact", head: true })
    .not("status", "in", "(paid,cancelled)");

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2">
          <Link href="/admin/products" className="font-display text-lg font-bold">គ្រប់គ្រងហាង</Link>
          <div className="flex items-center gap-1">
            <Link href="/" target="_blank" className="rounded-xl px-3 py-2.5 text-sm text-muted">មើលហាង</Link>
            <form action={signOut}>
              <button className="rounded-xl px-3 py-2.5 text-sm text-muted" title={user.email ?? ""}>ចាកចេញ</button>
            </form>
          </div>
        </div>
        <AdminNav pendingOrders={pendingOrders ?? 0} />
      </header>
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-4">{children}</div>
    </>
  );
}
