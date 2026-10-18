import Link from "next/link";
import { FinanceEntry } from "@/components/admin/FinanceEntry";
import { currentMonth, getFinance, monthLabel, shiftMonth } from "@/lib/finance";
import { formatUSD } from "@/lib/format";

function Money({ value, signed }: { value: number; signed?: boolean }) {
  const neg = value < 0;
  return (
    <span className={signed ? (neg ? "text-[#B42318]" : "text-[#0B6B4F]") : undefined}>
      {signed && !neg && value > 0 ? "+" : ""}
      {neg ? "−" : ""}
      {formatUSD(Math.abs(value))}
    </span>
  );
}

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const now = currentMonth();
  const month = /^\d{4}-\d{2}$/.test(m ?? "") && m! <= now ? m! : now;
  const { products, purchases, lastBuy, summary: s, trend, stockValue } = await getFinance(month);
  const maxAbs = Math.max(1, ...trend.map((t) => Math.abs(t.realProfit)), ...trend.map((t) => Math.abs(t.cashProfit)));

  return (
    <div className="flex flex-col gap-5">
      {/* ខែ */}
      <div className="flex items-center justify-between gap-2">
        <Link href={`/admin/finance?m=${shiftMonth(month, -1)}`} className="grid size-11 place-items-center rounded-xl bg-white text-xl" aria-label="ខែមុន">‹</Link>
        <h1 className="text-xl font-bold">📅 {monthLabel(month)}</h1>
        {month < now ? (
          <Link href={`/admin/finance?m=${shiftMonth(month, 1)}`} className="grid size-11 place-items-center rounded-xl bg-white text-xl" aria-label="ខែក្រោយ">›</Link>
        ) : (
          <span className="size-11" />
        )}
      </div>

      {/* សង្ខេប */}
      <section className="grid gap-2.5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm text-muted">💰 លក់បាន (បានបញ្ជាក់)</p>
          <p className="text-2xl font-bold">{formatUSD(s.revenue)}</p>
          <p className="text-xs text-muted">{s.orders} order{s.orders ? ` · មធ្យម ${formatUSD(s.revenue / s.orders)}` : ""}</p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm text-muted">💵 លុយចេញ-ចូល</p>
          <p className="text-2xl font-bold"><Money value={s.cashProfit} signed /></p>
          <p className="text-xs text-muted">លក់បាន − ទិញចូល {formatUSD(s.purchased)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm text-muted">📦 ចំណេញពិត</p>
          <p className="text-2xl font-bold"><Money value={s.realProfit} signed /></p>
          <p className="text-xs text-muted">លក់បាន − ថ្លៃដើមទំនិញលក់ {formatUSD(s.cogs)}</p>
        </div>
      </section>

      {s.missingCost.length > 0 && (
        <p role="alert" className="rounded-2xl bg-[#FDF1C7] p-3 text-sm leading-6 text-[#6B4A00]">
          ⚠️ មិនទាន់មានថ្លៃដើម: <b>{s.missingCost.join(", ")}</b> — ចំណេញពិតអាចខ្ពស់ជាងការពិត។ សូមកំណត់ “ថ្លៃដើមស្តុកចាស់” ខាងក្រោម។
        </p>
      )}

      {/* បញ្ចូលការទិញ */}
      <FinanceEntry month={month} monthText={monthLabel(month)} products={products} purchases={purchases} lastBuy={lastBuy} />

      {/* ផលិតផលលក់ដាច់ */}
      <section className="rounded-2xl bg-white p-4">
        <h2 className="mb-2 font-semibold">ផលិតផលលក់ដាច់ខែនេះ</h2>
        {s.top.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">មិនទាន់មាន order បានបញ្ជាក់ក្នុងខែនេះទេ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr><th className="py-2 font-normal">ផលិតផល</th><th className="font-normal">ចំនួន</th><th className="font-normal">លក់បាន</th><th className="font-normal">ចំណេញ</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {s.top.map((t) => (
                  <tr key={t.name}>
                    <td className="py-2 pr-2">{t.name}</td>
                    <td>{t.qty}</td>
                    <td>{formatUSD(t.revenue)}</td>
                    <td><Money value={Math.round((t.revenue - t.cost) * 100) / 100} signed /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ៦ ខែ */}
      <section className="rounded-2xl bg-white p-4">
        <h2 className="mb-3 font-semibold">ចំណេញ ៦ ខែចុងក្រោយ</h2>
        <ul className="flex flex-col gap-2.5">
          {trend.map((t) => (
            <li key={t.month} className="grid grid-cols-[72px_1fr_auto] items-center gap-2 text-sm">
              <span className="text-muted">{monthLabel(t.month).replace(/\s*\d{4}$/, "")}</span>
              <span className="flex flex-col gap-1">
                <span className="h-2.5 rounded-full" style={{ width: `${Math.max(2, (Math.abs(t.realProfit) / maxAbs) * 100)}%`, background: t.realProfit < 0 ? "#D93A2B" : "#0B6B4F" }} />
                <span className="h-1.5 rounded-full opacity-60" style={{ width: `${Math.max(2, (Math.abs(t.cashProfit) / maxAbs) * 100)}%`, background: t.cashProfit < 0 ? "#D93A2B" : "#2563C9" }} />
              </span>
              <span className="text-right font-semibold"><Money value={t.realProfit} signed /></span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex flex-wrap gap-x-4 text-xs text-muted">
          <span><span className="mr-1 inline-block h-2 w-4 rounded-full bg-[#0B6B4F] align-middle" />ចំណេញពិត</span>
          <span><span className="mr-1 inline-block h-1.5 w-4 rounded-full bg-[#2563C9] align-middle opacity-60" />លុយចេញ-ចូល</span>
          <span><span className="mr-1 inline-block h-2 w-4 rounded-full bg-[#D93A2B] align-middle" />ខាត</span>
        </p>
      </section>

      <p className="rounded-2xl bg-white p-4 text-sm">
        📦 តម្លៃស្តុកនៅសល់ (តាមថ្លៃដើម): <b>{formatUSD(stockValue)}</b>
      </p>
    </div>
  );
}
