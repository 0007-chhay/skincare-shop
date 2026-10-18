import Link from "next/link";
import { ProductAdminList } from "@/components/admin/ProductAdminList";
import { listAllProducts } from "@/lib/admin-products";

export default async function AdminProductsPage() {
  const products = await listAllProducts();

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">ផលិតផល <span className="font-normal text-muted">({products.length})</span></h1>
        <Link href="/admin/products/new" className="flex h-11 items-center rounded-2xl bg-leaf px-4 font-semibold text-white">
          + បន្ថែម
        </Link>
      </div>
      <ProductAdminList products={products} />
    </>
  );
}
