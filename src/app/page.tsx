import { CartBar } from "@/components/CartBar";
import { Header } from "@/components/Header";
import { ProductFeed } from "@/components/ProductFeed";
import { products } from "@/lib/products";

export default function HomePage() {
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
