import Link from "next/link";

type Props = { searchParams: Promise<{ no?: string; pm?: string }> };

export const metadata = { title: "អរគុណ" };

export default async function ThankYouPage({ searchParams }: Props) {
  const { no, pm } = await searchParams;
  const orderNo = /^\d+$/.test(no ?? "") ? no : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-[#D7EAE2]">
        <svg viewBox="0 0 24 24" className="size-10 text-leaf" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <h1 className="font-display text-2xl font-bold">អរគុណសម្រាប់ការបញ្ជាទិញ!</h1>
        {orderNo && <p className="mt-1 text-muted">លេខ order របស់អ្នក: <b className="text-ink">#{orderNo}</b></p>}
      </div>
      <p className="max-w-sm leading-8 text-muted">
        {pm === "khqr"
          ? "ហាងនឹងទាក់ទងអ្នកឆាប់ៗនេះ ដើម្បីបញ្ជាក់ order និងផ្ញើ KHQR សម្រាប់បង់ប្រាក់។"
          : "ហាងនឹងទាក់ទងអ្នកឆាប់ៗនេះ ដើម្បីបញ្ជាក់ order។ អ្នកបង់ប្រាក់ពេលទទួលទំនិញ។"}
      </p>
      <Link href="/" className="mt-2 flex h-12 items-center rounded-2xl bg-leaf px-8 font-semibold text-white">
        ត្រឡប់ទៅហាងវិញ
      </Link>
    </main>
  );
}
