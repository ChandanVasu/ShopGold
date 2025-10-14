"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductLabel from "@/components/ProductLabel";
import Link from "next/link";
import { Skeleton } from "@heroui/skeleton";
import Empty from "@/components/block/Empty";
import SliderCollection from "@/components/Colleaction/SliderCollection";

const SAMPLE_PRODUCTS = Array.from({ length: 10 }).map((_, i) => ({
  _id: `sample-${i}`,
  title: `Sample Product ${i + 1}`,
  shortDescription: "This is a sample product description.",
  salePrice: i % 2 === 0 ? 19.99 : null,
  regularPrice: 29.99,
  productLabel: i % 2 === 0 ? "New" : "Sale",
  images: [`https://placehold.co/400x500?text=Product+${i + 1}`],
  collections: ["Summer", "Winter", "Essentials"], // Add sample collections
}));

function AllProductsPage() {
  const searchParams = useSearchParams();
  const selectedCollection = searchParams.get("collection");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/product");
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        const validData = Array.isArray(data) && data.length > 0 ? data : SAMPLE_PRODUCTS;

        // 🔍 Filter by collection if search param exists
        const filtered = selectedCollection
          ? validData.filter((p) => Array.isArray(p.collections) && p.collections.some((c) => c.toLowerCase() === selectedCollection.toLowerCase()))
          : validData;

        setProducts(filtered);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products");
        setProducts(SAMPLE_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCollection]);

  return (
    <div className=" md:px-20 py-10 container mx-auto min-h-screen">
      <h1 className="md:text-2xl text-lg font-bold mb-6 text-center">{selectedCollection ? `Collection: ${selectedCollection}` : "All Products"}</h1>

      <div className="md:mt-10 mt-8 mb-10 ">
        <SliderCollection isTitle={false} />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 md:gap-6 gap-3 px-4">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-xl overflow-hidden">
              <Skeleton className="w-full aspect-[4/5] rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 md:gap-6 gap-3 px-4">
          {products.map((product) => (
            <Link href={`/product/${product._id}`} key={product._id}>
              <div className="bg-gray-100 border border-gray-50 rounded-xl overflow-hidden">
                <div className="relative">
                  <img
                    src={product.images?.[0] || "https://placehold.co/400x500?text=No+Image"}
                    alt={product.title}
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <ProductLabel label={product.productLabel} />
                </div>
                <div className="p-4 text-center bg-white">
                  <h2 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-1 mb-2 md:mb-3">{product.title}</h2>
                  <p className="text-xs line-clamp-2 mb-2 md:mb-3">{product.shortDescription}</p>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {product.salePrice ? (
                      <>
                        <span className="text-base font-bold text-black">${product.salePrice}</span>
                        <span className="text-sm line-through text-gray-400">${product.regularPrice}</span>
                      </>
                    ) : (
                      <span className="text-base font-bold text-gray-800">${product.regularPrice}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && <Empty title="No products found in this collection." />}

      {error && <p className="text-red-500 mt-6 text-center">{error}</p>}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AllProductsPage />
    </Suspense>
  );
}
