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

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="w-full px-2 sm:px-4">
        <Skeleton className="w-full h-[30vh] sm:h-[35vh] md:h-[50vh] lg:h-[60vh] rounded-xl" />
      </div>
    );
  }

  // Don't render if no images
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-2 sm:px-4">
      <div className="relative">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          slidesPerView={1}
          className="rounded-xl overflow-hidden"
          loop={images.length > 1}
          autoplay={images.length > 1 ? {
            delay: 4000,
            disableOnInteraction: false,
          } : false}
          pagination={images.length > 1 ? {
            clickable: true,
            dynamicBullets: true,
            dynamicMainBullets: 3,
            el: '.slider-pagination',
          } : false}
          navigation={false}
        >
          {images.map((item, index) => (
            <SwiperSlide key={item._id || index}>
              <div className="relative group">
                <a href={item.url || "#"} className="block">
                  <div className="w-full h-[30vh] sm:h-[35vh] md:h-[50vh] lg:h-[60vh] overflow-hidden">
                    <img src={item.image} alt={item.title || `Slide ${index + 1}`} className="w-full h-full object-cover" loading={index === 0 ? "eager" : "lazy"} />
                  </div>
                </a>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Pagination outside image */}
        {images.length > 1 && (
          <div className="slider-pagination flex justify-center mt-4"></div>
        )}
      </div>

      <style jsx global>{`
        .slider-pagination {
          position: relative !important;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .slider-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: rgba(107, 114, 128, 0.5);
          opacity: 0.5;
          transition: all 0.3s ease;
          margin: 0 4px !important;
        }
        .slider-pagination .swiper-pagination-bullet-active {
          background: rgb(75, 85, 99);
          opacity: 1;
          width: 24px;
          border-radius: 4px;
        }
        .slider-pagination .swiper-pagination-bullet-active-main {
          opacity: 1;
        }
        .slider-pagination .swiper-pagination-bullet-active-prev,
        .slider-pagination .swiper-pagination-bullet-active-next {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
