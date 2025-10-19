"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@heroui/skeleton";
import { Input, Button } from "@heroui/react";
import { Search, X, ShoppingCart, Heart } from "lucide-react";
import Empty from "@/components/block/Empty";
import { useCart } from "@/hooks/useCart";

function AllProductsPage() {
  const searchParams = useSearchParams();
  const selectedCollection = searchParams.get("collection");

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState([]);
  const { addToCart, isAddingToCart } = useCart();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/product", {
          cache: "force-cache",
          next: { revalidate: 300 }
        });
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        const validData = Array.isArray(data) && data.length > 0 ? data : [];

        // 🔍 Filter by collection if search param exists
        const filtered = selectedCollection ? validData.filter((p) => Array.isArray(p.collections) && p.collections.some((c) => c.toLowerCase() === selectedCollection.toLowerCase())) : validData;

        setProducts(filtered);
        setFilteredProducts(filtered);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products");
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCollection]);

  // Handle search filtering
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (product) =>
          product.title?.toLowerCase().includes(query) ||
          product.shortDescription?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleAddToCart = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product);
  };

  const handleWishlist = (product, e) => {
    e.preventDefault();
    e.stopPropagation();

    const wishlistItem = {
      productId: product._id,
      title: product.title,
      image: product.images?.[0],
      price: product.salePrice || product.regularPrice,
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
      currency: product.currencySymbol || process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$",
      rating: product.rating,
      productLabel: product.productLabel,
      addedAt: new Date().toISOString(),
    };

    let updatedWishlist;
    const isInWishlist = wishlist.some((item) => item.productId === product._id);

    if (isInWishlist) {
      updatedWishlist = wishlist.filter((item) => item.productId !== product._id);
    } else {
      updatedWishlist = [...wishlist, wishlistItem];
    }

    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    
    // Dispatch custom event to update header count
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.productId === productId);
  };

  const calculateDiscount = (regularPrice, salePrice) => {
    if (!salePrice || !regularPrice) return 0;
    return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
  };

  const isLimitedTimeDeal = (limitedTimeDeal) => {
    if (!limitedTimeDeal) return false;
    const dealEndTime = new Date(limitedTimeDeal).getTime();
    const currentTime = new Date().getTime();
    return currentTime < dealEndTime;
  };

  // Load wishlist on mount
  useEffect(() => {
    const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setWishlist(savedWishlist);
  }, []);

  return (
    <div className=" md:px-20 py-10 container mx-auto min-h-screen">
      <h1 className="md:text-2xl text-lg font-bold mb-6 text-center">{selectedCollection ? `Collection: ${selectedCollection}` : "All Products"}</h1>

      {/* Search Input */}
      <div className="px-4 mb-6 md:mb-8">
        <div className="max-w-2xl mx-auto">
          <Input
            type="text"
            placeholder="Search products by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<Search className="w-4 h-4 text-gray-400" />}
            endContent={
              searchQuery && (
                <button onClick={handleClearSearch} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )
            }
            classNames={{
              input: "text-sm",
              inputWrapper: "bg-white border border-gray-200 shadow-sm hover:border-gray-300",
            }}
            size="lg"
          />
          {searchQuery && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Found {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
            </p>
          )}
        </div>
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
          {filteredProducts.map((product) => {
            const discount = calculateDiscount(product.regularPrice, product.salePrice);
            const hasLimitedDeal = isLimitedTimeDeal(product.limitedTimeDeal);

            return (
              <div key={product._id} className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                <Link href={`/products/${product._id}`}>
                  <div className="relative">
                    <img src={product.images?.[0] || "https://placehold.co/400x500?text=No+Image"} alt={product.title} className="w-full aspect-[4/5] object-cover" />

                    {/* Product Label */}
                    {product.productLabel && (
                      <span className={`absolute top-1 sm:top-2 left-1 sm:left-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-lg backdrop-blur-sm ${
                        product.productLabel === 'New' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                        product.productLabel === 'Hot' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                        product.productLabel === 'Sale' ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white' :
                        product.productLabel === 'Best Seller' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                        product.productLabel === 'Trending' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black' :
                        product.productLabel === 'Limited Edition' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' :
                        'bg-gradient-to-r from-gray-700 to-gray-800 text-white'
                      }`}>
                        {product.productLabel}
                      </span>
                    )}

                    {/* Rating Badge at bottom */}
                    {product.rating && (
                      <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-green-600 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md flex items-center gap-1">
                        <span className="text-xs text-white font-medium">
                          {product.rating}.{Math.floor(Math.random() * 10) + 1}
                        </span>
                        <span className="text-xs text-white font-semibold">★</span>
                      </div>
                    )}

                    {/* Wishlist Heart Icon */}
                    <button
                      onClick={(e) => handleWishlist(product, e)}
                      className={`absolute top-1 sm:top-2 right-1 sm:right-2 p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
                        isInWishlist(product._id) ? "bg-red-500/90 text-white" : "bg-white/80 text-gray-600 hover:text-red-500"
                      }`}
                    >
                      <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isInWishlist(product._id) ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </Link>

                <div className="p-2 sm:p-4 bg-white">
                  <Link href={`/products/${product._id}`}>
                    {/* Product Name */}
                    <h2 className="text-xs md:text-sm font-medium text-gray-800 leading-tight line-clamp-1 mb-1 sm:mb-2">{product.title}</h2>

                    {/* Price */}
                    <div className="flex items-center justify-between gap-1 sm:gap-2 mb">
                      <div className="flex items-center gap-1 sm:gap-2">
                        {product.salePrice ? (
                          <>
                            <span className="text-sm sm:text-base font-semibold text-gray-900">
                              {product.currencySymbol || process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$"}
                              {product.salePrice}
                            </span>
                            <span className="text-xs sm:text-sm line-through text-gray-400">
                              {product.currencySymbol || process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$"}
                              {product.regularPrice}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm sm:text-base font-semibold text-gray-900">
                            {product.currencySymbol || process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$"}
                            {product.regularPrice}
                          </span>
                        )}
                      </div>

                      {/* Discount Badge */}
                      {discount > 0 && <div className="bg-white text-green-500 px-1 sm:px-2 py-0.5 rounded text-[10px] font-medium">{discount}% OFF</div>}
                    </div>

                    {/* Limited Time Deal Badge */}
                    {hasLimitedDeal && (
                      <div className="mb-1 text-center">
                        <span className="text-xs text-green-700 font-normal">Limited Time Deal</span>
                      </div>
                    )}
                  </Link>

                  {/* Add to Cart Button - Outside Link */}
                  <Button
                    size="sm"
                    isLoading={isAddingToCart(product._id)}
                    onPress={(e) => handleAddToCart(product, e)}
                    className="w-full bg-gray-800 text-white font-medium rounded-lg text-xs py-1 sm:text-sm sm:py-2"
                    startContent={!isAddingToCart(product._id) && <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />}
                  >
                    {isAddingToCart(product._id) ? "Adding..." : "Add to Cart"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && products.length === 0 && <Empty title="No products found in this collection." />}

      {!loading && products.length > 0 && filteredProducts.length === 0 && (
        <div className="px-4">
          <Empty 
            title="No products found" 
            description={`No products match "${searchQuery}". Try a different search term.`} 
          />
        </div>
      )}

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
