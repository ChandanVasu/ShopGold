import { notFound } from "next/navigation";
import Product from "./product";
import getDomainName from "@/lib/getServerDomainName";

// Component for product not found
function ProductNotFound() {
  return (
    <div className="container mx-auto px-4 md:px-20 py-12 sm:py-20 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Product Not Found</h1>
          <p className="text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8">Sorry, the product you're looking for doesn't exist or has been removed.</p>
          <div className="space-y-3 sm:space-y-4">
            <a 
              href="/product" 
              className="inline-block bg-gray-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-700 transition-colors duration-200"
            >
              Browse All Products
            </a>
            <br />
            <a 
              href="/" 
              className="inline-block text-gray-600 hover:text-gray-800 text-xs sm:text-sm font-medium transition-colors duration-200"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Page(props) {
  const { params } = props;
  const { id } = await params;

  const domainName = await getDomainName();

  const res = await fetch(`${domainName}/api/product/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return <ProductNotFound />;
  }

  const data = await res.json();
  
  // Additional check to ensure product data exists
  if (!data || Object.keys(data).length === 0) {
    return <ProductNotFound />;
  }
  
  return <Product data={data} />;
}

export async function generateMetadata(props) {
  const params = await props.params;
  const { id } = params;

  const domainName = await getDomainName();

  const res = await fetch(`${domainName}/api/product/${id}`, {
    cache: "force-cache",
  });

  if (!res.ok) {
    return {
      title: "Product Not Found",
      description: "The product you're looking for doesn't exist.",
    };
  }

  const product = await res.json();

  // Additional check for empty or invalid product data
  if (!product || !product.title || Object.keys(product).length === 0) {
    return {
      title: "Product Not Found",
      description: "The product you're looking for doesn't exist.",
    };
  }

  return {
    title: product.title,
    description: product.shortDescription || product.description?.substring(0, 160),
    openGraph: {
      title: product.title,
      description: product.shortDescription || product.description,
      images: product.images?.map((img) => img.url) || [],
    },
  };
}
