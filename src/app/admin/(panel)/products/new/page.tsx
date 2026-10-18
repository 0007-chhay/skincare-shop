import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <>
      <Link href="/admin/products" className="mb-2 inline-block py-2 text-sm text-muted">‹ ផលិតផលទាំងអស់</Link>
      <h1 className="mb-4 text-xl font-bold">បន្ថែមផលិតផល</h1>
      <ProductForm />
    </>
  );
}
