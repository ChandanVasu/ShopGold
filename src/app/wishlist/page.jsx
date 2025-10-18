"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@heroui/react";
import { useCart } from "@/hooks/useCart";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, isAddingToCart } = useCart();

  useEffect(() => {
    // Load wishlist from localStorage
    const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setWishlist(savedWishlist);
    setLoading(false);
  }, []);

  const handleRemoveFromWishlist = (productId) => {
    const updatedWishlist = wishlist.filter((item) => item.productId !== productId);
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    
    // Dispatch custom event to update header count
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const handleAddToCart = async (item) => {
    const product = {
      _id: item.productId,
      title: item.title,
      images: [item.image],
      salePrice: item.salePrice,
      regularPrice: item.regularPrice,
      currencySymbol: item.currency,
    };
    await addToCart(product);
  };

  const handleMoveToCart = async (item) => {
    await handleAddToCart(item);
    handleRemoveFromWishlist(item.productId);
  };

  const calculateDiscount = (regularPrice, salePrice) => {
    if (!salePrice || !regularPrice) return 0;
    return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Your Wishlist is Empty</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Save your favorite items here and never lose track of what you love!
            </p>
            <Link href="/products">
              <Button size="lg" className="bg-gray-900 text-white font-medium rounded-lg px-8">
                Explore Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
              <p className="text-gray-600 text-sm">
                {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
              </p>
            </div>
            <Heart className="w-8 h-8 text-red-500 fill-current" />
          </div>

          {/* Wishlist Items */}
          <div className="space-y-6">
            {wishlist.map((item) => {
              const discount = calculateDiscount(item.regularPrice, item.salePrice);
              
              return (
                <div
                  key={item.productId}
                  className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-all"
                >
                  {/* Product Image */}
                  <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                    <img
                      src={item.image || "https://placehold.co/400x500?text=No+Image"}
                      alt={item.title}
                      className="w-full sm:w-32 h-40 sm:h-32 object-cover rounded-lg"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <Link href={`/products/${item.productId}`}>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 hover:text-gray-700 mb-2 line-clamp-2">
                          {item.title}
                        </h3>
                      </Link>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl font-bold text-gray-900">
                          {item.currency}
                          {item.salePrice || item.regularPrice}
                        </span>
                        {item.salePrice && (
                          <>
                            <span className="text-sm line-through text-gray-400">
                              {item.currency}
                              {item.regularPrice}
                            </span>
                            {discount > 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                                {discount}% OFF
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Rating */}
                      {item.rating && (
                        <div className="flex items-center gap-1 mb-3">
                          <span className="text-sm text-green-600 font-semibold">★</span>
                          <span className="text-sm text-gray-700 font-medium">{item.rating}/5</span>
                        </div>
                      )}

                      {/* Product Label */}
                      {item.productLabel && (
                        <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium mb-3">
                          {item.productLabel}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        size="sm"
                        isLoading={isAddingToCart(item.productId)}
                        onPress={() => handleMoveToCart(item)}
                        className="bg-gray-900 text-white font-medium rounded-lg flex-1 sm:flex-none"
                        startContent={!isAddingToCart(item.productId) && <ShoppingCart className="w-4 h-4" />}
                      >
                        {isAddingToCart(item.productId) ? "Moving..." : "Move to Cart"}
                      </Button>
                      <Button
                        size="sm"
                        onPress={() => handleRemoveFromWishlist(item.productId)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-lg"
                        startContent={<Trash2 className="w-4 h-4" />}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row gap-4 justify-between items-center">
            <Link href="/products">
              <Button size="lg" variant="bordered" className="border-gray-300 text-gray-700 font-medium rounded-lg">
                Continue Shopping
              </Button>
            </Link>
            <p className="text-sm text-gray-500 text-center sm:text-right">
              Added on {new Date(wishlist[0]?.addedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
