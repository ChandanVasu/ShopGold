"use client";

import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Skeleton } from "@heroui/skeleton";

const COLLECTION = "slider-image";
const PROMO_COLLECTION = "promo-text";

export default function StyleOne() {
  const [images, setImages] = useState([]);
  const [promoTexts, setPromoTexts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [sliderRes, promoRes] = await Promise.all([
          fetch(`/api/data?collection=${COLLECTION}`, {
            cache: "force-cache",
            next: { revalidate: 300 }
          }),
          fetch(`/api/data?collection=${PROMO_COLLECTION}`, {
            cache: "force-cache",
            next: { revalidate: 300 }
          })
        ]);

        const sliderData = await sliderRes.json();
        const promoData = await promoRes.json();

        if (sliderRes.ok) {
          const sorted = sliderData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setImages(sorted);
        }

        if (promoRes.ok && promoData.length > 0) {
          const activePromos = promoData.filter(item => item.status === "Active");
          setPromoTexts(activePromos);
        } else {
          // Hide promo bar if no data from admin
          setPromoTexts([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data");
        // Hide promo bar on error
        setPromoTexts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
    <div className="w-full">
      <div className="px-2 sm:px-4">
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
      </div>

      {/* Infinite Scrolling Text Bar */}
      {promoTexts.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 mt-6 overflow-hidden relative">
          <div className="flex animate-marquee whitespace-nowrap">
            {/* Take only the first text and repeat it 500 times for infinite loop */}
            {Array(500).fill(null).map((_, index) => (
              <span key={index} className="text-lg font-bold mx-8 flex items-center">
                {promoTexts[0].text || `${promoTexts[0].emoji || "🎉"} ${promoTexts[0].title || promoTexts[0].content} ${promoTexts[0].emoji || "🎉"}`}
              </span>
            ))}
          </div>
        </div>
      )}

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
        
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-marquee {
          animation: marquee 120s linear infinite;
        }
        
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        
        /* Much faster speed for mobile devices */
        @media (max-width: 768px) {
          .animate-marquee {
            animation: marquee 15s linear infinite;
          }
        }
      `}</style>
    </div>
  );
}
