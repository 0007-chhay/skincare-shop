import { CartBar } from "@/components/CartBar";
import { Header } from "@/components/Header";
import { ProductFeed } from "@/components/ProductFeed";
import { getProducts } from "@/lib/products";

export const revalidate = 60;

export default async function HomePage() {
  const products = await getProducts();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl pb-28">
        <ProductFeed products={products} />
      </main>
      <CartBar />
    </>
  );
}
