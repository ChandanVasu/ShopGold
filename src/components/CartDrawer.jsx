"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer";
import ProductLabel from "@/components/ProductLabel";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export default function CartDrawer({ isOpen, onClose }) {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { symbol: currencySymbol } = useCurrency();

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
    const updatedCart = cartItems.map((item) =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartItems(updatedCart);
  };

  const getTotalItems = () => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((total, item) => {
      const quantity = item?.quantity || 0;
      return total + quantity;
    }, 0);
  };

  const getTotalPrice = () => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((total, item) => {
      const price = item?.price || 0;
      const quantity = item?.quantity || 0;
      return total + (price * quantity);
    }, 0);
  };

  const getDiscountDetails = () => {
    let totalMRP = 0;
    let discountOnMRP = 0;
    
    // Calculate MRP and discount using product data
    cartItems.forEach(item => {
      const product = getProductDetails(item.productId);
      const itemMRP = product?.regularPrice || item.price || 0; // Use product's regular price as MRP
      const itemPrice = item.price || 0; // Cart item's sale price
      
      totalMRP += itemMRP * item.quantity;
      discountOnMRP += (itemMRP - itemPrice) * item.quantity;
    });

    // ✅ Buy 2 Get 1 Free logic - Calculate for each product separately
    let buy2Get1Discount = 0;
    cartItems.forEach(item => {
      const freeItems = Math.floor(item.quantity / 3); // For every 3 items, 1 is free
      const itemPrice = item.price || 0;
      buy2Get1Discount += freeItems * itemPrice; // Discount = free items × price per item
    });

    const totalAmount = getTotalPrice() - buy2Get1Discount;

    return { totalMRP, discountOnMRP, buy2Get1Discount, totalAmount };
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
      currency: item.currency || currencySymbol,
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
        base: "max-w-md max-w-[80%] md:max-w-[22%]",
      }}
    >
      <DrawerContent>
        <DrawerHeader className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
            {!loading && cartItems.length > 0 && (
              <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded-full">
                {getTotalItems()} items
              </span>
            )}
          </div>
        </DrawerHeader>

        <DrawerBody className="px-0">
          {loading ? (
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
            <div className="px-6 space-y-4">
              {cartItems.map((item, index) => {
                const product = getProductDetails(item.productId);
                if (!product) return null;
                const imageUrl =
                  item.image || product.images?.[0] || "https://placehold.co/400x500?text=No+Image";

                return (
                  <div
                    key={`${item.productId}-${index}`}
                    className="bg-white rounded-lg border border-gray-200 shadow  transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-3">
                      {/* Product Image and Basic Info Row */}
                      <div className="flex gap-3">
                        <Link href={`/products/${item.productId}`} onClick={onClose}>
                          <div className="relative w-14 h-14 rounded-md overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                            <img
                              src={imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                            {product.productLabel && (
                              <div className="absolute -top-1 -right-1">
                                <ProductLabel label={product.productLabel} size="xs" />
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="flex-1 min-w-0 space-y-2">
                          <Link href={`/products/${item.productId}`} onClick={onClose}>
                            <h4 className="text-xs font-medium text-gray-900 line-clamp-1 hover:text-blue-600 transition-colors leading-tight">
                              {item.title}
                            </h4>
                          </Link>

                          {/* Price Section */}
                          <div className="space-y-1">
                            {(() => {
                              const itemMRP = product?.regularPrice || item.price || 0;
                              const itemPrice = item.price || 0;
                              const totalPrice = itemPrice * item.quantity;
                              const totalMRP = itemMRP * item.quantity;
                              const discount = totalMRP - totalPrice;
                              const freeItems = Math.floor(item.quantity / 3);
                              const buy2Get1Discount = freeItems * itemPrice;

                              return (
                                <>
                                  {discount > 0 && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-400 line-through">
                                        {currencySymbol}{totalMRP.toFixed(0)}
                                      </span>
                                      <span className="text-xs text-green-600 font-medium bg-green-50 px-1 rounded">
                                        -{currencySymbol}{discount.toFixed(0)}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className="font-semibold text-gray-900 text-sm">
                                    {currencySymbol}{(totalPrice - buy2Get1Discount).toFixed(0)}
                                    {freeItems > 0 && (
                                      <span className="text-xs text-blue-600 ml-1 font-normal">
                                        (saved {currencySymbol}{buy2Get1Discount.toFixed(0)})
                                      </span>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          {/* Quantity and Remove Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center bg-gray-50 rounded-md border border-gray-200">
                              <button
                                onClick={() =>
                                  handleQuantityChange(item.productId, item.quantity - 1)
                                }
                                className="p-1.5 hover:bg-gray-100 rounded-l-md transition-colors"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-3 h-3 text-gray-600" />
                              </button>
                              <span className="px-2 py-1.5 text-xs font-medium text-gray-900 min-w-[1.5rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleQuantityChange(item.productId, item.quantity + 1)
                                }
                                className="p-1.5 hover:bg-gray-100 rounded-r-md transition-colors"
                              >
                                <Plus className="w-3 h-3 text-gray-600" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemove(item.productId)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Buy 2 Get 1 Free Offer Badge */}
                      {(() => {
                        const freeItems = Math.floor(item.quantity / 3);
                        if (freeItems > 0) {
                          return (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-md px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-blue-700 font-medium">🎉 Buy 2 Get 1 Free!</span>
                                  </div>
                                  <span className="text-xs text-blue-600 font-semibold">
                                    {freeItems} free
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DrawerBody>

        {!loading && cartItems.length > 0 && getTotalItems() > 0 && (
          <DrawerFooter className="flex-col gap-3 pt-3 border-t border-gray-200">
            {(() => {
              const { totalMRP, discountOnMRP, buy2Get1Discount, totalAmount } =
                getDiscountDetails();

              return (
                <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-2">
                  <div className="flex justify-between text-xs text-gray-700">
                    <span>Total MRP</span>
                    <span className="font-medium">{currencySymbol}{totalMRP.toFixed(0)}</span>
                  </div>
                  {discountOnMRP > 0 && (
                    <div className="flex justify-between text-xs text-green-600">
                      <span>Discount on MRP</span>
                      <span className="font-medium">-{currencySymbol}{discountOnMRP.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-700">
                    <span>Total Price</span>
                    <span className="font-semibold">{currencySymbol}{(totalMRP - discountOnMRP).toFixed(0)}</span>
                  </div>
                  {buy2Get1Discount > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-md p-2 mt-2">
                      <div className="flex justify-between text-blue-600 mb-1">
                        <span className="text-xs font-medium">🎉 Buy 2 Get 1 Free Applied</span>
                        <span className="text-xs font-semibold">-{currencySymbol}{buy2Get1Discount.toFixed(0)}</span>
                      </div>
                      <div className="text-xs text-blue-700 space-y-0.5">
                        {cartItems.map((item, index) => {
                          const freeItems = Math.floor(item.quantity / 3);
                          if (freeItems > 0) {
                            return (
                              <div key={`offer-${item.productId}-${index}`} className="flex justify-between">
                                <span className="truncate max-w-[130px] text-xs">{item.title}</span>
                                <span className="font-medium text-xs">{freeItems} free</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                    <span className="text-sm font-semibold text-gray-900">Total Amount</span>
                    <span className="text-sm font-bold text-gray-900">{currencySymbol}{totalAmount.toFixed(0)}</span>
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    {getTotalItems()} Items selected for order
                  </div>
                </div>
              );
            })()}

            <Button
              onPress={handleCheckout}
              className="w-full bg-gray-900 text-white h-11 rounded-lg font-semibold text-sm mt-2 shadow-sm hover:bg-gray-800 transition-colors"
            >
              Pay Now
            </Button>

            {/* <div className="flex items-center justify-center gap-2 text-xs text-gray-500 border-t pt-2 mt-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <img src="https://www.crunchskizy.in/static/media/safety-image.ed81de067e878303f73f.jpg" alt="" />
            </div> */}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
