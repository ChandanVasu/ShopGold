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

  // Don't render anything while loading or if no images
  if (isLoading || images.length === 0) {
    return null;
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
                <div className="w-full h-[150px] sm:h-[200px] md:h-[400px] lg:h-[500px] overflow-hidden">
                  <img src={item.image} alt={item.title || `Slide ${index + 1}`} className="w-full h-full object-cover" loading={index === 0 ? "eager" : "lazy"} />
                </div>
              </a>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
