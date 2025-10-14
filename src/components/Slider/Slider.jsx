"use client";

import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Skeleton } from "@heroui/skeleton";

const COLLECTION = "slider-image";

export default function StyleOne() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSliderImages = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/data?collection=${COLLECTION}`);
        const data = await res.json();
        if (res.ok) {
          const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setImages(sorted);
        } else {
          setError("Failed to load images");
        }
      } catch (error) {
        console.error("Error fetching slider images:", error);
        setError("Failed to load images");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSliderImages();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-[150px] sm:h-[200px] md:h-[400px] lg:h-[500px] p-2 sm:p-4">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
    );
  }

  // Show improved empty state when no images available
  if (images.length === 0) {
    return (
      <div className="w-full px-4 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col justify-center items-center min-h-48 sm:min-h-64 bg-gray-50 rounded-xl ">
            <div className="text-center space-y-4">
              {/* Icon */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-900">No Slider Images Available</h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md px-4">The image slider is currently empty. Please check back later or contact support if this continues.</p>
              </div>

              {/* CTA */}
              <div className="pt-2">
                <button className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-800 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200">Refresh Page</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 sm:px-4">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        slidesPerView={1}
        className="hide-swiper-dots rounded-xl overflow-hidden"
        loop={true}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          bulletClass: "swiper-pagination-bullet opacity-60",
          bulletActiveClass: "swiper-pagination-bullet-active opacity-100",
        }}
        navigation={{
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        }}
      >
        {images.map((item, index) => (
          <SwiperSlide key={item._id || index}>
            <div className="relative group">
              <a href={item.url || "#"} className="block">
                <img
                  src={item.image}
                  alt={item.title || `Slide ${index + 1}`}
                  className="w-full h-[150px] sm:h-[200px] md:h-[400px] lg:h-[500px] object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                {/* Overlay for better text readability if needed */}
                {item.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 sm:p-6">
                    <h3 className="text-white text-xs sm:text-sm font-medium">{item.title}</h3>
                  </div>
                )}
              </a>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
