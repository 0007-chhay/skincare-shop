import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartBar } from "@/components/AddToCartBar";
import { BottleArt } from "@/components/BottleArt";
import { BackIcon } from "@/components/icons";
import { QuestionForm } from "@/components/QuestionForm";
import { formatUSD } from "@/lib/format";
import { concernLabel, getProduct, getProducts } from "@/lib/products";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  return {
    title: product.nameKm,
    description: product.description,
    openGraph: product.image ? { images: [product.image] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, all] = await Promise.all([getProduct(slug), getProducts()]);
  if (!product) notFound();

  const related = all
    .filter((p) => p.slug !== product.slug && p.concerns.some((c) => product.concerns.includes(c)))
    .slice(0, 2);

  const sections = [
    { title: "ប្រសិទ្ធភាព", body: product.description },
    { title: "របៀបប្រើ", body: product.howToUse },
    { title: "គ្រឿងផ្សំសំខាន់ៗ", body: product.ingredients },
  ].filter((s) => s.body);

  return (
    <div className="mx-auto max-w-xl pb-32">
      <div className="relative grid h-[420px] place-items-center overflow-hidden sm:mt-4 sm:rounded-3xl" style={{ backgroundColor: product.tint }}>
        {product.image ? (
          <Image src={product.image} alt={product.nameKm} fill priority sizes="(min-width: 640px) 576px, 100vw" className="object-cover" />
        ) : (
          <BottleArt tint={product.tint} className="h-[270px]" />
        )}
        <Link href="/" aria-label="ត្រឡប់ក្រោយ" className="absolute left-3 top-3 z-10 grid size-11 place-items-center rounded-full bg-white">
          <BackIcon className="size-5" />
        </Link>
        {product.tag && (
          <span className="absolute right-3 top-4 z-10 rounded-full bg-white px-3 py-1 text-[13px]">{product.tag}</span>
        )}
      </div>

      <main className="flex flex-col gap-4 p-4">
        <div>
          <p className="text-[13px] text-muted">
            {product.nameEn}
            {product.size && ` · ${product.size}`}
          </p>
          <h1 className="font-display text-2xl font-bold leading-normal">{product.nameKm}</h1>
          <p className="text-2xl font-semibold">{formatUSD(product.price)}</p>
        </div>

        {product.concerns.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="សមស្របសម្រាប់">
            {product.concerns.map((c) => (
              <li key={c} className="rounded-full bg-white px-3 py-1.5 text-[13px]">{concernLabel(c)}</li>
            ))}
          </ul>
        )}

        {sections.map((s) => (
          <section key={s.title} className="rounded-[20px] bg-white p-4">
            <h2 className="mb-1.5 text-base font-semibold">{s.title}</h2>
            <p className="whitespace-pre-line text-sm leading-7 text-muted">{s.body}</p>
          </section>
        ))}

        <QuestionForm productSlug={product.slug} productName={product.nameKm} />

        {related.length > 0 && (
          <section>
            <h2 className="mb-2.5 text-base font-semibold">ប្រើជាមួយគ្នាល្អ</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {related.map((p) => (
                <Link key={p.slug} href={`/p/${p.slug}`} className="flex flex-col gap-1.5 rounded-2xl bg-white p-2">
                  <span className="relative grid h-[110px] place-items-center overflow-hidden rounded-xl" style={{ backgroundColor: p.tint }}>
                    {p.image ? (
                      <Image src={p.image} alt="" fill sizes="200px" className="object-cover" />
                    ) : (
                      <BottleArt tint={p.tint} className="h-[80px]" />
                    )}
                  </span>
                  <span className="text-[13px] leading-normal">{p.nameKm}</span>
                  <span className="text-sm font-semibold">{formatUSD(p.price)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <AddToCartBar slug={product.slug} inStock={product.inStock} />
    </div>
  );
}
