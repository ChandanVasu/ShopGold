"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import ProductLabel from "@/components/ProductLabel";
import { Skeleton } from "@heroui/skeleton";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Heart } from "lucide-react";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(localCart);

    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/product");
        if (!res.ok) throw new Error("Failed to fetch products");

        const allProducts = await res.json();
        const cartProductIds = localCart.map((item) => item.productId);
        const matchedProducts = allProducts.filter((p) => cartProductIds.includes(p._id));

        setProducts(matchedProducts);
      } catch (error) {
        console.error("Error loading cart products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getProductDetails = (productId) => products.find((p) => p._id === productId);

  const handleRemove = (productId) => {
    const updatedCart = cartItems.filter((item) => item.productId !== productId);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartItems(updatedCart);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cartItems.map((item) =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartItems(updatedCart);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleBuyNow = () => {
    const buyNowData = cartItems.map((item) => ({
      productId: item.productId,
      title: item.title,
      quantity: item.quantity,
      color: item.color || null,
      size: item.size || null,
      image: item.image,
      price: item.price,
      currency: item.currency || "$",
    }));

    localStorage.setItem("buyNow", JSON.stringify(buyNowData));
    window.location.href = "/checkout";
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-20 py-6 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-medium text-gray-900 mb-2">Shopping Cart</h1>
          {!loading && cartItems.length > 0 && (
            <p className="text-sm text-gray-600">
              {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart
            </p>
          )}
        </div>

        {loading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6">
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                      <Skeleton className="w-20 h-20 rounded-xl" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-8 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-12 w-full mt-6" />
                </div>
              </div>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-white rounded-3xl p-12 mb-8 shadow-sm">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-3">Your cart is empty</h2>
              <p className="text-gray-600 mb-8 max-w-md">
                Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
              </p>
              <Link href="/">
                <Button 
                  size="lg" 
                  className="bg-gray-900 text-white h-12 px-8 rounded-2xl font-medium"
                  startContent={<ShoppingBag className="w-4 h-4" />}
                >
                  Start Shopping
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Cart Content */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Cart Items</h3>
                <div className="space-y-4">
                  {cartItems.map((item, index) => {
                    const product = getProductDetails(item.productId);
                    if (!product) return null;

                    const imageUrl = item.image || product.images?.[0] || "https://placehold.co/400x500?text=No+Image";

                    return (
                      <div key={`${item.productId}-${index}`} className="flex gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                        {/* Product Image */}
                        <Link href={`/product/${item.productId}`} className="flex-shrink-0">
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white">
                            <img 
                              src={imageUrl} 
                              alt={item.title} 
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                            {product.productLabel && (
                              <div className="absolute -top-1 -right-1">
                                <ProductLabel label={product.productLabel} size="xs" />
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/product/${item.productId}`}>
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-gray-700 transition-colors">
                              {item.title}
                            </h4>
                          </Link>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4">
                              {/* Quantity Controls */}
                              <div className="flex items-center bg-white rounded-xl">
                                <button
                                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                  className="p-2 hover:bg-gray-100 rounded-l-xl transition-colors"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="w-3 h-3 text-gray-600" />
                                </button>
                                <span className="px-4 py-2 text-sm font-medium text-gray-900 min-w-[3rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                  className="p-2 hover:bg-gray-100 rounded-r-xl transition-colors"
                                >
                                  <Plus className="w-3 h-3 text-gray-600" />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="text-sm font-semibold text-gray-900">
                                {item.currency}{(item.price * item.quantity).toFixed(2)}
                              </div>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemove(item.productId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 sticky top-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({getTotalItems()} items)</span>
                    <span className="font-medium text-gray-900">${getTotalPrice()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between">
                      <span className="text-base font-medium text-gray-900">Total</span>
                      <span className="text-lg font-semibold text-gray-900">${getTotalPrice()}</span>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleBuyNow}
                  className="w-full bg-gray-900 text-white h-12 rounded-2xl font-medium mb-4"
                  endContent={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Checkout
                </Button>

                <Link href="/">
                  <Button
                    variant="flat"
                    size="lg"
                    className="w-full bg-gray-100 text-gray-700 h-12 rounded-2xl font-medium"
                  >
                    Continue Shopping
                  </Button>
                </Link>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Free Shipping</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Easy Returns</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>24/7 Support</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}