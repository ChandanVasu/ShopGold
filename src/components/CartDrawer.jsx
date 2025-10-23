"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer";
import ProductLabel from "@/components/ProductLabel";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, X } from "lucide-react";

export default function CartDrawer({ isOpen, onClose }) {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCartData();
    }
  }, [isOpen]);

  const loadCartData = async () => {
    setLoading(true);
    const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(localCart);

    try {
      const res = await fetch("/api/product", {
        cache: "force-cache",
        next: { revalidate: 300 },
      });
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

  const getProductDetails = (productId) => products.find((p) => p._id === productId);

  const handleRemove = (productId) => {
    const updatedCart = cartItems.filter((item) => item.productId !== productId);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartItems(updatedCart);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedCart = cartItems.map((item) => (item.productId === productId ? { ...item, quantity: newQuantity } : item));
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartItems(updatedCart);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
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
    onClose();
    window.location.href = "/checkout";
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      placement="right"
      size="lg"
      classNames={{
        backdrop: "bg-black/50",
        base: "max-w-md max-w-[80%] md:max-w-[20%]",
      }}
    >
      <DrawerContent>
        <DrawerHeader className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
            {!loading && cartItems.length > 0 && <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded-full">{getTotalItems()}</span>}
          </div>
          
        </DrawerHeader>

        <DrawerBody className="px-0">
          {loading ? (
            /* Loading State */
            <div className="px-6 space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-xl animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : cartItems.length === 0 ? (
            /* Empty Cart */
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 text-sm mb-6">Add some products to get started!</p>
              <Button onPress={onClose} className="bg-gray-900 text-white px-6">
                Continue Shopping
              </Button>
            </div>
          ) : (
            /* Cart Items */
            <div className="px-6 space-y-4">
              {cartItems.map((item, index) => {
                const product = getProductDetails(item.productId);
                if (!product) return null;

                const imageUrl = item.image || product.images?.[0] || "https://placehold.co/400x500?text=No+Image";

                return (
                  <div key={`${item.productId}-${index}`} className="flex gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    {/* Product Image */}
                    <Link href={`/products/${item.productId}`} onClick={onClose}>
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0">
                        <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        {product.productLabel && (
                          <div className="absolute -top-1 -right-1">
                            <ProductLabel label={product.productLabel} size="xs" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.productId}`} onClick={onClose}>
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-gray-700 transition-colors">{item.title}</h4>
                      </Link>

                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm font-semibold text-gray-900">
                          {getProductDetails(item.productId)?.currencySymbol || item.currency || "$"}
                          {(item.price * item.quantity).toFixed(2)}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center bg-white rounded-lg border">
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                              className="p-1 hover:bg-gray-100 rounded-l-lg transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3 text-gray-600" />
                            </button>
                            <span className="px-2 py-1 text-xs font-medium text-gray-900 min-w-[1.5rem] text-center">{item.quantity}</span>
                            <button onClick={() => handleQuantityChange(item.productId, item.quantity + 1)} className="p-1 hover:bg-gray-100 rounded-r-lg transition-colors">
                              <Plus className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button onClick={() => handleRemove(item.productId)} className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove item">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DrawerBody>

        {cartItems.length > 0 && (
          <DrawerFooter className="flex-col gap-4 pt-4 border-t border-gray-100">
            {/* Total */}
            <div className="flex justify-between items-center w-full">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-xl font-bold text-gray-900">
                {products[0]?.currencySymbol || "$"}
                {getTotalPrice()}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full">
              <Link href="/cart" className="flex-1" onClick={onClose}>
                <Button variant="bordered" className="w-full h-11 rounded-xl font-medium">
                  View Cart
                </Button>
              </Link>
              <Button onPress={handleCheckout} className="flex-1 bg-gray-900 text-white h-11 rounded-xl font-medium" endContent={<ArrowRight className="w-4 h-4" />}>
                Checkout
              </Button>
            </div>

            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Secure checkout • Free shipping</span>
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
