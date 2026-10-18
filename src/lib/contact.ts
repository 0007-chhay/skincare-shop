import { site } from "./site";

// ព័ត៌មានទាក់ទងហាង
// អាចប្តូរតាម .env.local / Vercel (ប្រភេទ Config) ដោយមិនចាំបាច់កែ code:
//   NEXT_PUBLIC_TELEGRAM_USERNAME=...   NEXT_PUBLIC_TIKTOK_USERNAME=...   NEXT_PUBLIC_SHOP_PHONE=...
const DEFAULT_TELEGRAM = "skincareshop2077";
const DEFAULT_TIKTOK = ""; // ← ពេលបង្កើត TikTok រួច ដាក់ username នៅទីនេះ (គ្មាន @) ឬក្នុង .env

const tgRaw = (site.telegram ?? "").replace(/^@/, "");
const tg = /^[A-Za-z0-9_]{4,32}$/.test(tgRaw) && tgRaw !== "your_shop" ? tgRaw : DEFAULT_TELEGRAM;
const tt = (process.env.NEXT_PUBLIC_TIKTOK_USERNAME || DEFAULT_TIKTOK).replace(/^@/, "");

export const shopContact = {
  name: site.name,
  telegram: tg,
  tiktok: /^[A-Za-z0-9_.]{2,24}$/.test(tt) ? tt : null, // ទទេ = លាក់ប៊ូតុង TikTok
  phone: (process.env.NEXT_PUBLIC_SHOP_PHONE ?? "").replace(/[^0-9+]/g, "") || null,
};
