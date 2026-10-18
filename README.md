# ហាងថែរក្សាស្បែក (ម៉ូដ E · បែប Feed)

Next.js 15 + Tailwind CSS 4 · Deploy នៅលើ Vercel

## ដំណើរការលើកុំព្យូទ័រ

```bash
npm install
cp .env.example .env.local   # កែឈ្មោះហាង និង Telegram
npm run dev                  # បើក http://localhost:3000
```

## រចនាសម្ព័ន្ធ

```
src/
  app/
    layout.tsx        ពុម្ពអក្សរខ្មែរ (Battambang + Noto Sans Khmer)
    page.tsx          ទំព័រដើម (Feed)
    cart/page.tsx     កន្ត្រក
    globals.css       ពណ៌ និងពុម្ពអក្សររបស់ហាង
  components/         Header, ProductCard, ProductFeed, CartBar ...
  lib/
    products.ts       ទិន្នន័យផលិតផល (ជំហាន ២ → Supabase)
    cart.tsx          កន្ត្រក (រក្សាទុកក្នុងទូរស័ព្ទអតិថិជន)
    site.ts           ឈ្មោះហាង និង Telegram
```

## ដាក់រូបថតផលិតផល

ដាក់រូបក្នុង `public/products/` រួចបន្ថែម `image: "/products/ឈ្មោះរូប.jpg"` ក្នុង `src/lib/products.ts`។

## Deploy ទៅ Vercel

1. Push project នេះទៅ GitHub
2. ចូល vercel.com → Add New → Project → ជ្រើស repo
3. Environment Variables: បន្ថែម `NEXT_PUBLIC_SHOP_NAME` និង `NEXT_PUBLIC_TELEGRAM_USERNAME`
4. ចុច Deploy
