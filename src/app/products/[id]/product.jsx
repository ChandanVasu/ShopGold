"use client";

import React, { useState, useEffect } from "react";
import ProductGallery from "@/components/ProductGallery";
import SliderProduct from "@/components/Product/SliderProduct";
import SliderCollection from "@/components/Colleaction/SliderCollection";
import VideoReels from "@/components/VideoReels";
import SupportBenefits from "@/components/SupportBenefits";
import ProductGrid from "@/components/Product/ProductGrid";
import { BadgeCheck, ShieldCheck, ShoppingCart } from "lucide-react";

import { ShoppingBag, Heart, Star, Truck, Shield, RotateCcw, ChevronRight, Share2, Plus, Minus, Check, Gift, Tag, Percent, Award, Box } from "lucide-react";
import { Button } from "@heroui/react";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";

export default function Product({ data }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [showMobileFooter, setShowMobileFooter] = useState(true); // Always show from beginning
  const [timeLeft, setTimeLeft] = useState(8 * 60);
  const [pincode, setPincode] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [storeSettings, setStoreSettings] = useState(null);
  const { addToCart, isAddingToCart } = useCart();
  const { symbol: currencySymbol } = useCurrency();

  useEffect(() => {
    const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setWishlist(savedWishlist);

    // Fetch store settings
    fetchStoreSettings();

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          return 8 * 60;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const fetchStoreSettings = async () => {
    try {
      const response = await fetch("/api/setting?type=store");
      if (response.ok) {
        const settings = await response.json();
        setStoreSettings(settings);
      }
    } catch (error) {
      console.error("Failed to fetch store settings:", error);
    }
  };

  const handleQuantityChange = (type) => {
    if (type === "increment") {
      setQuantity(quantity + 1);
    } else if (type === "decrement" && quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = async () => {
    await addToCart(data, quantity);
  };

  const handleBuyNow = () => {
    const buyNowData = [
      {
        productId: data._id,
        title: data.title,
        quantity: quantity,
        color: selectedColor || null,
        size: selectedSize || null,
        image: data.images?.[0] || "",
        price: parseFloat(data.salePrice || data.regularPrice),
        currency: data.currencySymbol || currencySymbol,
      },
    ];

    localStorage.setItem("buyNow", JSON.stringify(buyNowData));
    window.location.href = "/checkout";
  };

  const handleWishlist = () => {
    const wishlistItem = {
      productId: data._id,
      title: data.title,
      image: data.images[0]?.url,
      price: data.salePrice || data.regularPrice,
      regularPrice: data.regularPrice,
      salePrice: data.salePrice,
      currency: data.currencySymbol || "₹",
      rating: data.rating,
      productLabel: data.productLabel,
      addedAt: new Date().toISOString(),
    };

    let updatedWishlist;
    const isInWishlist = wishlist.some((item) => item.productId === data._id);

    if (isInWishlist) {
      updatedWishlist = wishlist.filter((item) => item.productId !== data._id);
    } else {
      updatedWishlist = [...wishlist, wishlistItem];
    }

    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const isInWishlist = () => {
    return wishlist.some((item) => item.productId === data._id);
  };

  const handleShare = async () => {
    const shareData = {
      title: data.title,
      text: `Check out this amazing product: ${data.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);

        const notification = document.createElement("div");
        notification.textContent = "Link copied to clipboard!";
        notification.className = "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity";
        document.body.appendChild(notification);

        setTimeout(() => {
          notification.style.opacity = "0";
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 2000);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) {
      setPincode(value);
      if (value.length === 6) {
        checkDelivery(value);
      } else {
        setDeliveryInfo(null);
      }
    }
  };

  const checkDelivery = async (pincodeValue) => {
    setCheckingDelivery(true);

    setTimeout(() => {
      setDeliveryInfo({
        available: true,
        days: 2,
        location: getLocationFromPincode(pincodeValue),
        freeDelivery: true,
        codAvailable: true,
      });
      setCheckingDelivery(false);
    }, 1000);
  };

  const getLocationFromPincode = (pincode) => {
    const locations = {
      11: "Delhi",
      12: "Haryana",
      40: "Mumbai",
      56: "Karnataka",
      60: "Tamil Nadu",
      50: "Telangana",
      30: "Rajasthan",
      20: "Punjab",
    };

    const prefix = pincode.substring(0, 2);
    return locations[prefix] || "India";
  };

  const calculateDiscount = () => {
    if (data.salePrice && data.regularPrice) {
      return Math.round(((+data.regularPrice - +data.salePrice) / +data.regularPrice) * 100);
    }
    return 0;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const discount = calculateDiscount();

  return (
    <div className="bg-white min-h-screen">
      {/* Main Product Section */}
      <div className="container mx-auto px-3 py-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Product Gallery */}
          <div>
            <ProductGallery images={data.images} title={data.title} />
          </div>

          {/* Right: Product Details */}
          <div className="space-y-4">
            {/* Title & Rating */}
            <div>
              <h1 className="text-lg font-medium text-gray-900 leading-relaxed mb-2">{data.title}</h1>

              {data.rating && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center bg-green-600 text-white px-2 py-1 rounded text-xs font-medium gap-1">
                    <span>{data.rating}</span>
                    <Star className="w-3 h-3 fill-white" />
                  </div>
                  <span className="text-xs text-gray-500">
                    {data.ratingsCount || "0"} ratings & {data.reviewsCount || "0"} reviews
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {data.salePrice && discount > 0 && <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">{discount}% OFF</span>}
                <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">Best Price</span>
              </div>

              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  {data.currencySymbol || currencySymbol}
                  {data.salePrice || data.regularPrice}
                </span>
                {data.salePrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {data.currencySymbol || currencySymbol}
                    {data.regularPrice}
                  </span>
                )}
              </div>

              {data.salePrice && discount > 0 && (
                <div className="bg-green-100 rounded-lg p-2 mb-2">
                  <div className="flex items-center gap-2 text-green-800">
                    <Gift className="w-3 h-3" />
                    <span className="text-xs font-medium">
                      You Save: {data.currencySymbol || currencySymbol}
                      {(+data.regularPrice - +data.salePrice).toFixed(0)}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">Inclusive of all taxes • Free shipping</p>
            </div>

            {/* Countdown Timer */}
            {
              <div className="bg-white border border-gray-300 rounded-lg p-3">
                <h3 className="text-center text-xs font-medium text-gray-700 mb-3">Offer ends in</h3>
                <div className="flex items-center justify-center gap-2">
                  {/* Hours */}
                  <div className="flex flex-col items-center">
                    <div className="bg-black text-white rounded-lg w-12 h-12 flex items-center justify-center">
                      <span className="text-lg font-bold">
                        {Math.floor(timeLeft / 3600)
                          .toString()
                          .padStart(2, "0")}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-700 mt-1">Hours</span>
                  </div>

                  {/* Separator */}
                  <div className="flex flex-col gap-1 pb-4">
                    <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
                  </div>

                  {/* Minutes */}
                  <div className="flex flex-col items-center">
                    <div className="bg-black text-white rounded-lg w-12 h-12 flex items-center justify-center">
                      <span className="text-lg font-bold">
                        {Math.floor((timeLeft % 3600) / 60)
                          .toString()
                          .padStart(2, "0")}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-700 mt-1">Minutes</span>
                  </div>

                  {/* Separator */}
                  <div className="flex flex-col gap-1 pb-4">
                    <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
                  </div>

                  {/* Seconds */}
                  <div className="flex flex-col items-center">
                    <div className="bg-black text-white rounded-lg w-12 h-12 flex items-center justify-center">
                      <span className="text-lg font-bold">{(timeLeft % 60).toString().padStart(2, "0")}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-700 mt-1">Seconds</span>
                  </div>
                </div>
              </div>
            }

            {/* Stock & Special Offer */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">Special Offer: Buy 2 Get 1 Free!</h3>
                  <p className="text-xs text-blue-700">Add 3 items to cart and get 1 absolutely free</p>
                </div>
              </div>
            </div>

            {/* Size Selector */}
            {data.sizes && data.sizes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-gray-900">Size:</h3>
                <div className="flex flex-wrap gap-2">
                  {data.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-2 border rounded text-xs font-medium transition-all ${
                        selectedSize === size ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-300 hover:border-gray-400 text-gray-700"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {data.colors && data.colors.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-gray-900">Color:</h3>
                <div className="flex flex-wrap gap-2">
                  {data.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${selectedColor === color ? "border-orange-500 scale-110" : "border-gray-300"}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-3">
              {" "}
              <span className="text-sm font-medium text-gray-900 mb-4">Quantity:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange("decrement")}
                  disabled={quantity <= 1}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-medium min-w-[30px] text-center">{quantity}</span>
                <button onClick={() => handleQuantityChange("increment")} className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {data.stockStatus === "Out of Stock" ? (
                <Button size="sm" disabled={true} className="flex-1 bg-gray-300 text-gray-500 font-medium cursor-not-allowed h-10 text-xs rounded-lg">
                  Out of Stock
                </Button>
              ) : (
                <Button size="sm" isLoading={isAddingToCart(data._id)} onPress={handleAddToCart} className="flex-1 bg-yellow-400 text-gray-900 font-medium hover:bg-yellow-500 h-10 text-xs rounded-lg">
                  {isAddingToCart(data._id) ? "Adding..." : "Add to Cart"}
                </Button>
              )}
              <Button
                size="sm"
                onPress={handleBuyNow}
                disabled={data.stockStatus === "Out of Stock"}
                className="flex-1 bg-orange-500 text-white font-medium hover:bg-orange-600 h-10 text-xs rounded-lg disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {data.stockStatus === "Out of Stock" ? "Out of Stock" : "Buy Now"}
              </Button>
            </div>

            {/* Wishlist & Share */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleWishlist}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 border rounded-lg text-xs font-medium transition-colors ${
                  isInWishlist() ? "border-red-500 text-red-600 bg-red-50" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Heart className={`w-3 h-3 ${isInWishlist() ? "fill-current" : ""}`} />
                <span>Wishlist</span>
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-4 gap-2 md:gap-4 py-4 md:py-6 border-t border-gray-200">
              <div className="flex flex-col items-center text-center gap-1">
                <BadgeCheck className="w-5 h-5 md:w-8 md:h-8 text-gray-700" />
                <div className="text-[10px] md:text-xs font-medium text-gray-700 line-clamp-2 leading-tight">PREMIUM QUALITY</div>
              </div>

              <div className="flex flex-col items-center text-center gap-1">
                <Truck className="w-5 h-5 md:w-8 md:h-8 text-gray-700" />
                <div className="text-[10px] md:text-xs font-medium text-gray-700 line-clamp-2 leading-tight">SHIPPING FREE</div>
              </div>

              <div className="flex flex-col items-center text-center gap-1">
                <ShoppingCart className="w-5 h-5 md:w-8 md:h-8 text-gray-700" />
                <div className="text-[10px] md:text-xs font-medium text-gray-700 line-clamp-2 leading-tight">BEST PRICE GUARANTEE</div>
              </div>

              <div className="flex flex-col items-center text-center gap-1">
                <ShieldCheck className="w-5 h-5 md:w-8 md:h-8 text-gray-700" />
                <div className="text-[10px] md:text-xs font-medium text-gray-700 line-clamp-2 leading-tight">VERIFIED AND SECURED</div>
              </div>
            </div>
            {/* Delivery Check */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-4 h-4 text-gray-700" />
                <span className="text-xs font-medium text-gray-900">Delivery Check</span>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pincode}
                    onChange={handlePincodeChange}
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Button
                    size="sm"
                    isLoading={checkingDelivery}
                    isDisabled={pincode.length !== 6}
                    onPress={() => checkDelivery(pincode)}
                    className="bg-gray-900 text-white font-medium hover:bg-gray-800 px-3 py-2 text-xs rounded-lg"
                  >
                    {checkingDelivery ? "..." : "Check"}
                  </Button>
                </div>

                {deliveryInfo && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900 mb-2">Available To Your Location</p>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-700">
                            🚚 <strong>3-4 Day Guaranteed Delivery</strong>
                          </p>
                          <p className="text-xs text-gray-700">🎁 Free Delivery</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description - Open by default */}
            {data.description && (
              <div className="pt-3 border-t border-gray-200">
                <h3 className="text-xs font-medium text-gray-900 mb-2">Product Details</h3>
                <div className="text-xs text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: data.description }} />
              </div>
            )}

            {/* Delivery Time Dropdown */}
            <div className="pt-2">
              <details className="group border border-gray-200 rounded-lg">
                <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold text-gray-900 py-3 px-4">
                  Delivery Time
                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-3 pt-1 border-t border-gray-200">
                  <p className="text-xs text-gray-700 mb-2">It Will take Max 4 to 7 Days For Delivery In India.</p>
                  <a href="/pages/shipping-info" className="text-xs text-blue-600 font-medium hover:underline">
                    View More
                  </a>
                </div>
              </details>
            </div>

            {/* Return & Exchange Dropdown */}
            <div className="pt-2">
              <details className="group border border-gray-200 rounded-lg">
                <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold text-gray-900 py-3 px-4">
                  Return & Exchange
                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-3 pt-1 border-t border-gray-200">
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">
                    We have a friendly replacement policy to ensure your online purchase is free of stress. We offer 3 Days Exchange for our valued customers. We are always with you, before your
                    purchase and after your purchase. We are not perfect but we have ensured that our replacement policies do not bring any ugly surprises to you post your purchase.
                  </p>
                  <a href="/pages/return-policy" className="text-xs text-blue-600 font-medium hover:underline">
                    View More
                  </a>
                </div>
              </details>
            </div>

            {/* Company Details Dropdown */}
            <div className="pt-2">
              <details className="group border border-gray-200 rounded-lg">
                <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold text-gray-900 py-3 px-4">
                  Company Details
                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-3 pt-1 border-t border-gray-200 space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-900">Company Name: </span>
                    <span className="text-xs text-gray-700">{storeSettings?.storeName || "Store Name"}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-900">Email: </span>
                    <span className="text-xs text-gray-700">{storeSettings?.storeEmail || "support@store.com"}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-900">Registered Address: </span>
                    <span className="text-xs text-gray-700">{storeSettings?.storeAddress || "Store Address"}</span>
                  </div>
                </div>
              </details>
            </div>

            {/* Trust Badges Section */}
            <div className="pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 mb-2 flex items-center justify-center bg-green-50 rounded-full">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-900">Genuine Products</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 mb-2 flex items-center justify-center bg-blue-50 rounded-full">
                    <Check className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-900">7 Step Quality Check</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 mb-2 flex items-center justify-center bg-green-50 rounded-full">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-900">Secure Payments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}

      <div className="py-6 bg-gray-50">
        <h1 className="text-lg font-semibold text-gray-900 px-4 md:px-20 container mx-auto mb-2">Related Products</h1>
        <ProductGrid />
      </div>

      {/* Support Benefits */}
      <div className="bg-gray-50">
        <SupportBenefits />
      </div>

      {/* Mobile Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden">
        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 ">
              <div className="flex items-center gap-2">
                <p className="text-xl font-semibold text-gray-900">
                  {data.currencySymbol}
                  {data.salePrice || data.regularPrice}
                </p>
                {data.salePrice && (
                  <p className="text-xs text-gray-500 line-through">
                    {data.currencySymbol}
                    {data.regularPrice}
                  </p>
                )}
              </div>
              {discount > 0 && <p className="text-xs text-green-600 font-medium">Save {discount}%</p>}
            </div>

            <div className="flex gap-2">
              {data.stockStatus === "Out of Stock" ? (
                <Button size="sm" disabled={true} className="bg-gray-300 text-gray-500 font-medium cursor-not-allowed px-3 py-2 text-xs rounded-lg">
                  Out of Stock
                </Button>
              ) : (
                <Button size="sm" isLoading={isAddingToCart(data._id)} onPress={handleAddToCart} className="bg-yellow-400 text-gray-900 font-medium hover:bg-yellow-500 px-3 py-2 text-xs rounded-lg">
                  {isAddingToCart(data._id) ? "Adding..." : "Add to Cart"}
                </Button>
              )}
              <Button
                size="sm"
                onPress={handleBuyNow}
                disabled={data.stockStatus === "Out of Stock"}
                className="bg-orange-500 text-white font-medium hover:bg-orange-600 px-8 py-2 text-xs rounded-lg disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {data.stockStatus === "Out of Stock" ? "Out of Stock" : "Buy Now"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-20 md:hidden"></div>
    </div>
  );
}
