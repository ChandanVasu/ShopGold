"use client";
import { useEffect, useState } from "react";
import ProductLabel from "@/components/ProductLabel";
import Link from "next/link";
import { Skeleton } from "@heroui/skeleton";
import { ShoppingCart, Clock, Heart } from "lucide-react";
import { Button } from "@heroui/react";
import { useCart } from "@/hooks/useCart";

export default function StyleOne() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const { addToCart, isAddingToCart } = useCart();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/product", {
          cache: "force-cache",
          next: { revalidate: 300 },
        });
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    // Load wishlist from localStorage
    const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setWishlist(savedWishlist);

    fetchProducts();
  }, []);

  const handleAddToCart = async (product, e) => {
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
      // Remove from wishlist
      updatedWishlist = wishlist.filter((item) => item.productId !== product._id);
    } else {
      // Add to wishlist
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

  const getTimeRemaining = (limitedTimeDeal) => {
    if (!limitedTimeDeal) return "";
    const dealEndTime = new Date(limitedTimeDeal).getTime();
    const currentTime = new Date().getTime();
    const timeLeft = dealEndTime - currentTime;

    if (timeLeft <= 0) return "Expired";

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d left`;
    }
    return `${hours}h ${minutes}m left`;
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-green-600 font-semibold">★</span>
        <span className="text-xs text-gray-700 font-medium">{rating}/5</span>
      </div>
    );
  };

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="px-4 md:px-20 container mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 md:gap-6 gap-3">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
              <Skeleton className="w-full aspect-[4/5]" />
              <div className="p-2 sm:p-4 bg-white">
                <Skeleton className="w-full h-4 mb-2 rounded" />
                <Skeleton className="w-24 h-4 mb-2 rounded" />
                <Skeleton className="w-full h-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Don't render if no products
  if (products.length === 0) {
    return null;
  }

  // Get products to display (max 10 for home page)
  const displayProducts = products.slice(0, 10);
  const hasMoreProducts = products.length > 10;

  return (
    <div className="px-4 md:px-20 container mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 md:gap-6 gap-3">
        {displayProducts.map((product) => {
          const discount = calculateDiscount(product.regularPrice, product.salePrice);
          const hasLimitedDeal = isLimitedTimeDeal(product.limitedTimeDeal);

          return (
            <div key={product._id} className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
              <Link href={`/products/${product._id}`}>
                <div className="relative">
                  <img src={product.images?.[0] || "https://placehold.co/400x500?text=No+Image"} alt={product.title} className="w-full aspect-[4/5] object-cover" />

                  {/* Product Label */}
                  {product.productLabel && <ProductLabel label={product.productLabel} />}

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
                  <h2 className="text-xs md:text-sm font-medium text-gray-800 leading-tight line-clamp-1 mb-1 sm:mb-2 ">{product.title}</h2>

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

      {/* View More Button */}
      {hasMoreProducts && (
        <div className="flex justify-center mt-8">
          <Link href="/products">
            <Button size="sm" className="bg-blue-400 text-white font-medium rounded-lg px-8">
              View More
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
