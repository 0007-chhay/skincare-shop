import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductById } from "@/lib/admin-products";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="mb-2 inline-block py-2 text-sm text-muted">‹ ផលិតផលទាំងអស់</Link>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-bold">{product.name_km}</h1>
        <Link href={`/p/${product.slug}`} target="_blank" className="text-sm text-leaf">មើលលើហាង ›</Link>
      </div>
      <ProductForm product={product} />
    </>
  );
}
