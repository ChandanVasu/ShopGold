"use client";

import React, { useState, useEffect } from "react";
import ProductGallery from "@/components/ProductGallery";
import SliderProduct from "@/components/Product/SliderProduct";
import SliderCollection from "@/components/Colleaction/SliderCollection";
import VideoReels from "@/components/VideoReels";
import SupportBenefits from "@/components/SupportBenefits";
import { ShoppingBag, Zap, ShieldCheck, Truck, Repeat, BadgeCheck, Eye, Heart } from "lucide-react";
import { Button } from "@heroui/react";
import { useCart } from "@/hooks/useCart";

export default function Product({ data }) {
  const [quantity, setQuantity] = useState(1);
  const [viewerCount, setViewerCount] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const { addToCart, isAddingToCart } = useCart();

  useEffect(() => {
    setViewerCount(Math.floor(Math.random() * 1000) + 30);
    
    // Load wishlist from localStorage
    const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setWishlist(savedWishlist);
  }, []);

  const handleAddToCart = async () => {
    await addToCart(data, quantity);
  };

  const handleBuyNow = () => {
    const buyNowData = {
      productId: data._id,
      title: data.title,
      quantity: quantity,
      color: null,
      size: null,
      image: data.images[0]?.url,
      price: data.salePrice || data.regularPrice,
      currency: data.currencySymbol || "₹",
    };

    localStorage.setItem("directPurchase", JSON.stringify(buyNowData));
    window.location.href = "/checkout?direct=true";
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
    const isInWishlist = wishlist.some(item => item.productId === data._id);

    if (isInWishlist) {
      updatedWishlist = wishlist.filter(item => item.productId !== data._id);
    } else {
      updatedWishlist = [...wishlist, wishlistItem];
    }

    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
  };

  const isInWishlist = () => {
    return wishlist.some(item => item.productId === data._id);
  };

  return (
    <div>
      <section className="container mx-auto px-4 md:px-20 md:py-10 py-4 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        <ProductGallery images={data.images} title={data.title} />

        <div className="flex flex-col justify-start gap-6">
          {/* Product Info Section */}
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-medium text-gray-900 leading-tight">{data.title}</h1>
            
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl md:text-4xl font-semibold text-gray-900">
                {data.currencySymbol}
                {data.salePrice ? data.salePrice : data.regularPrice}
              </span>

              {data.salePrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {data.currencySymbol}
                    {data.regularPrice}
                  </span>
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {Math.round(((+data.regularPrice - +data.salePrice) / +data.regularPrice) * 100)}% OFF
                  </div>
                </>
              )}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">{data.shortDescription}</p>
          </div>

          {/* Live Viewer Count */}
          {viewerCount !== null && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm text-blue-800 font-medium">{viewerCount} people viewing this now</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                isLoading={isAddingToCart(data._id)}
                onPress={handleAddToCart}
                className="flex-1 bg-gray-900 text-white font-medium hover:bg-gray-800 h-14 text-sm rounded-2xl"
                startContent={!isAddingToCart(data._id) && <ShoppingBag className="w-5 h-5" />}
              >
                {isAddingToCart(data._id) ? "Adding to Cart..." : "Add to Cart"}
              </Button>
              <Button
                onPress={handleBuyNow}
                size="lg"
                className="flex-1 bg-blue-600 text-white font-medium hover:bg-blue-700 h-14 text-sm rounded-2xl"
                startContent={<Zap className="w-5 h-5" />}
              >
                Buy Now
              </Button>
            </div>
            
            <Button
              onPress={handleWishlist}
              variant="flat"
              size="lg"
              className={`w-full h-14 font-medium text-sm rounded-2xl transition-all duration-200 ${
                isInWishlist() 
                  ? "bg-red-50 text-red-600 hover:bg-red-100" 
                  : "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600"
              }`}
              startContent={<Heart className={`w-5 h-5 ${isInWishlist() ? "fill-current" : ""}`} />}
            >
              {isInWishlist() ? "Remove from Wishlist" : "Add to Wishlist"}
            </Button>
          </div>

          {/* Trust Features */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl">
              <div className="p-2 bg-green-100 rounded-xl">
                <ShieldCheck className="text-green-600 w-5 h-5" />
              </div>
              <span className="text-green-800 font-medium">Secure Payment</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Truck className="text-blue-600 w-5 h-5" />
              </div>
              <span className="text-blue-800 font-medium">Free Shipping</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-2xl">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <Repeat className="text-yellow-600 w-5 h-5" />
              </div>
              <span className="text-yellow-800 font-medium">Easy Returns</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl">
              <div className="p-2 bg-purple-100 rounded-xl">
                <BadgeCheck className="text-purple-600 w-5 h-5" />
              </div>
              <span className="text-purple-800 font-medium">Verified Quality</span>
            </div>
          </div>
        </div>
      </section>

      {data.description && (
        <div className="container mx-auto px-4 md:px-20 pt-3 md:pt-5">
          <div className="text-gray-800 text-xs sm:text-sm md:text-base leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: data.description }} />
        </div>
      )}

      <div className="mt-6 md:mt-12">
        <SliderProduct />
      </div>
      <div className="mt-6 md:mt-12">
        <SliderCollection isTitle={false} />
      </div>
      <div className="mt-6 md:mt-12">
        <VideoReels />
      </div>
      <div className="mt-4 md:mt-8">
        <SupportBenefits />
      </div>
    </div>
  );
}
