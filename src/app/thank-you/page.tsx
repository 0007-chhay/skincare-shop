import Image from "next/image";
import Link from "next/link";
import { formatUSD } from "@/lib/format";
import { khqr } from "@/lib/payment";
import { site } from "@/lib/site";

type Props = { searchParams: Promise<{ no?: string; pm?: string; t?: string }> };

export const metadata = { title: "អរគុណ" };

export default async function ThankYouPage({ searchParams }: Props) {
  const { no, pm, t } = await searchParams;
  const orderNo = /^\d+$/.test(no ?? "") ? no : null;
  const total = /^\d+(\.\d{1,2})?$/.test(t ?? "") ? Number(t) : null;
  const isKhqr = pm === "khqr";

  const receiptMessage = `សួស្តី! ខ្ញុំបានបង់ប្រាក់សម្រាប់ Order #${orderNo ?? ""}${total !== null ? ` (${formatUSD(total)})` : ""}។ នេះជារូបវិក្កយបត្រ៖`;
  const receiptLink = `https://t.me/${site.telegram}?text=${encodeURIComponent(receiptMessage)}`;

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-5 px-5 py-10 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-[#D7EAE2]">
        <svg viewBox="0 0 24 24" className="size-8 text-leaf" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <h1 className="font-display text-2xl font-bold">អរគុណសម្រាប់ការបញ្ជាទិញ!</h1>
        {orderNo && <p className="mt-1 text-muted">លេខ order របស់អ្នក: <b className="text-ink">#{orderNo}</b></p>}
      </div>

      {isKhqr ? (
        <section className="flex w-full flex-col items-center gap-4 rounded-3xl bg-white p-5">
          <h2 className="text-lg font-semibold">បង់ប្រាក់តាម KHQR</h2>
          {total !== null && (
            <p className="text-3xl font-bold">{formatUSD(total)}</p>
          )}
          <div className="w-full max-w-[280px] overflow-hidden rounded-2xl border border-line">
            {khqr.imageUrl && (
              <Image
                src={khqr.imageUrl}
                alt="KHQR សម្រាប់បង់ប្រាក់"
                width={560}
                height={760}
                className="h-auto w-full"
                priority
              />
            )}
          </div>
          {khqr.accountName && <p className="text-sm text-muted">ឈ្មោះគណនី: <b className="text-ink">{khqr.accountName}</b></p>}
          <ol className="flex w-full flex-col gap-2 rounded-2xl bg-mint p-4 text-left text-sm leading-7">
            <li>១. ស្កេន QR ដោយកម្មវិធីធនាគារណាមួយ (ABA, ACLEDA, Wing ...)</li>
            <li>២. បញ្ចូលចំនួនទឹកប្រាក់{total !== null && <> <b>{formatUSD(total)}</b></>}{orderNo && <> ហើយសរសេរ <b>#{orderNo}</b> ក្នុងកំណត់ចំណាំ</>}</li>
            <li>៣. ផ្ញើរូបវិក្កយបត្រមកហាង</li>
          </ol>
          <p className="text-xs leading-6 text-muted">
            បើបើកនៅលើទូរស័ព្ទ: ថតរូបអេក្រង់ ឬចុចឲ្យជាប់លើ QR ដើម្បីរក្សាទុក រួចជ្រើស “ស្កេនពីរូបភាព” ក្នុងកម្មវិធីធនាគារ។
          </p>
          <a
            href={receiptLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-leaf font-semibold text-white"
          >
            ផ្ញើរូបវិក្កយបត្រតាម Telegram
          </a>
        </section>
      ) : (
        <p className="max-w-sm leading-8 text-muted">
          ហាងនឹងទាក់ទងអ្នកឆាប់ៗនេះ ដើម្បីបញ្ជាក់ order។ អ្នកបង់ប្រាក់ពេលទទួលទំនិញ។
        </p>
      )}

      <Link href="/" className="flex h-12 items-center rounded-2xl border-[1.5px] border-ink px-8 font-semibold">
        ត្រឡប់ទៅហាងវិញ
      </Link>
    </main>
  );
}
