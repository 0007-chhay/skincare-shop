import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { signOut } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

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
        <nav aria-label="Admin" className="mx-auto flex max-w-3xl gap-1 px-4 pb-2 text-sm">
          <Link href="/admin/products" className="rounded-full bg-ink px-4 py-2 text-white">ផលិតផល</Link>
          <span className="rounded-full px-4 py-2 text-[#8AA197]">Order · ឆាប់ៗ</span>
          <span className="rounded-full px-4 py-2 text-[#8AA197]">សំណួរ · ឆាប់ៗ</span>
        </nav>
      </header>
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-4">{children}</div>
    </>
  );
}
