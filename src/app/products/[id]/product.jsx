"use client";

import React, { useState, useEffect } from "react";
import ProductGallery from "@/components/ProductGallery";
import SliderProduct from "@/components/Product/SliderProduct";
import SliderCollection from "@/components/Colleaction/SliderCollection";
import VideoReels from "@/components/VideoReels";
import SupportBenefits from "@/components/SupportBenefits";
import { ShoppingBag, Heart, Star, Truck, Shield, RotateCcw, ChevronRight, Share2, Plus, Minus, Check } from "lucide-react";
import { Button } from "@heroui/react";
import { useCart } from "@/hooks/useCart";

export default function Product({ data }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const { addToCart, isAddingToCart } = useCart();

  useEffect(() => {
    // Load wishlist from localStorage
    const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setWishlist(savedWishlist);
  }, []);

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
    const buyNowData = [{
      productId: data._id,
      title: data.title,
      quantity: quantity,
      color: selectedColor || null,
      size: selectedSize || null,
      image: data.images?.[0] || "",
      price: parseFloat(data.salePrice || data.regularPrice),
      currency: data.currencySymbol || "$",
    }];

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
    
    // Dispatch event to update header
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const isInWishlist = () => {
    return wishlist.some((item) => item.productId === data._id);
  };

  const calculateDiscount = () => {
    if (data.salePrice && data.regularPrice) {
      return Math.round(((+data.regularPrice - +data.salePrice) / +data.regularPrice) * 100);
    }
    return 0;
  };

  const discount = calculateDiscount();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Main Product Section */}
      <div className="bg-white">
        <div className="container mx-auto px-4 md:px-8 lg:px-16 py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
            {/* Left: Product Gallery */}
            <div>
              <ProductGallery images={data.images} title={data.title} />
            </div>

            {/* Right: Product Details */}
            <div className="space-y-4">
              {/* Title */}
              <h1 className="text-xl md:text-2xl font-normal text-gray-900 leading-snug">{data.title}</h1>

              {/* Rating */}
              {data.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-green-700 text-white px-2 py-0.5 rounded text-xs font-medium gap-1">
                    <span>{data.rating}</span>
                    <Star className="w-3 h-3 fill-white" />
                  </div>
                  <span className="text-sm text-gray-600">1,234 ratings</span>
                </div>
              )}

              {/* Price */}
              <div className="border-t border-b border-gray-200 py-4">
                <div className="flex items-baseline gap-2 flex-wrap">
                  {data.salePrice && discount > 0 && (
                    <span className="text-sm text-red-600 font-medium">-{discount}%</span>
                  )}
                  <span className="text-2xl md:text-3xl font-normal text-gray-900">
                    {data.currencySymbol}
                    {data.salePrice || data.regularPrice}
                  </span>
                </div>
                {data.salePrice && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">M.R.P.:</span>
                    <span className="text-sm text-gray-500 line-through">
                      {data.currencySymbol}
                      {data.regularPrice}
                    </span>
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-1">Inclusive of all taxes</p>
                {data.salePrice && discount > 0 && (
                  <p className="text-sm text-green-700 font-medium mt-2">
                    You save {data.currencySymbol}
                    {(+data.regularPrice - +data.salePrice).toFixed(2)} ({discount}%)
                  </p>
                )}
              </div>

              {/* Stock Status */}
              <div className="bg-green-50 border border-green-200 rounded px-4 py-2 inline-block">
                <p className="text-sm font-medium text-green-700">In Stock</p>
              </div>

              {/* Offers */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Offers</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Bank Offer: 5% Unlimited Cashback on Axis Bank Credit Card</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Partner Offers: Get GST invoice and save up to 28% on business purchases</span>
                  </div>
                </div>
              </div>

              {/* Size Selector */}
              {data.sizes && data.sizes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Size:</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border rounded text-sm font-medium transition-all ${
                          selectedSize === size
                            ? "border-orange-500 bg-orange-50 text-orange-600"
                            : "border-gray-300 hover:border-gray-400 text-gray-700"
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
                  <h3 className="text-sm font-semibold text-gray-900">Color:</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedColor === color ? "border-orange-500 scale-110" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Quantity:</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange("decrement")}
                    disabled={quantity <= 1}
                    className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-base font-medium min-w-[40px] text-center">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange("increment")}
                    className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  size="lg"
                  isLoading={isAddingToCart(data._id)}
                  onPress={handleAddToCart}
                  className="w-full bg-yellow-400 text-gray-900 font-medium hover:bg-yellow-500 h-12 text-sm rounded-full shadow-sm"
                >
                  {isAddingToCart(data._id) ? "Adding..." : "Add to Cart"}
                </Button>
                <Button
                  size="lg"
                  onPress={handleBuyNow}
                  className="w-full bg-orange-500 text-white font-medium hover:bg-orange-600 h-12 text-sm rounded-full shadow-sm"
                >
                  Buy Now
                </Button>
              </div>

              {/* Wishlist & Share */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleWishlist}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border rounded-lg text-sm font-medium transition-colors ${
                    isInWishlist()
                      ? "border-red-500 text-red-600 bg-red-50"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist() ? "fill-current" : ""}`} />
                  <span>Wishlist</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <Shield className="w-5 h-5 text-gray-500" />
                  <span>Secure transaction</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <RotateCcw className="w-5 h-5 text-gray-500" />
                  <span>7 days replacement</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <Truck className="w-5 h-5 text-gray-500" />
                  <span>Free shipping</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Quality assured</span>
                </div>
              </div>

              {/* Description */}
              {data.shortDescription && (
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">About this item</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{data.shortDescription}</p>
                </div>
              )}

              {/* Full Description */}
              {data.description && (
                <div className="pt-4 border-t border-gray-200">
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-gray-900 py-2">
                      Product Details
                      <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                    </summary>
                    <div 
                      className="text-sm text-gray-700 leading-relaxed mt-2 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: data.description }}
                    />
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="py-8 bg-white mt-4">
        <div className="container mx-auto px-4 md:px-8 lg:px-16">
          <h2 className="text-xl md:text-2xl font-medium text-gray-900 mb-4">Related Products</h2>
          <SliderProduct />
        </div>
      </div>

      {/* Collections */}
      <div className="py-8 bg-white mt-4">
        <SliderCollection isTitle={false} />
      </div>

      {/* Video Reels */}
      <div className="py-8 bg-white mt-4">
        <VideoReels />
      </div>

      {/* Support Benefits */}
      <div className="bg-white mt-4">
        <SupportBenefits />
      </div>
    </div>
  );
}
