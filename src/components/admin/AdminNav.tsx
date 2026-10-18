"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ pendingOrders = 0 }: { pendingOrders?: number }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/admin/orders", label: "បញ្ជាក់ Order", badge: pendingOrders },
    { href: "/admin/products", label: "ផលិតផល", badge: 0 },
    { href: "/admin/promos", label: "កូដបញ្ចុះតម្លៃ", badge: 0 },
    { href: "/admin/finance", label: "Finance", badge: 0 },
  ];
  return (
    <nav aria-label="Admin" className="no-scrollbar mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 ${active ? "bg-ink text-white" : "text-ink"}`}
          >
            {t.label}
            {t.badge > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-[#D93A2B] px-1.5 text-xs font-bold text-white">{t.badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
