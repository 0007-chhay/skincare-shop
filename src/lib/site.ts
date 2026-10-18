// ការកំណត់ហាង — កែនៅទីនេះ ឬក្នុង .env.local / Vercel Environment Variables
export const site = {
  name: process.env.NEXT_PUBLIC_SHOP_NAME ?? "ឈ្មោះហាង",
  description: "ផលិតផលថែរក្សាស្បែក ដឹកជញ្ជូនទូទាំងប្រទេស",
  // ឈ្មោះ Telegram របស់ហាង (គ្មាន @)
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ?? "your_shop",
};

export function telegramLink(message?: string) {
  const base = `https://t.me/${site.telegram}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
