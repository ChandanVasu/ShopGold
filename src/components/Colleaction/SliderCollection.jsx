"use client";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Link from "next/link";
import { Skeleton } from "@heroui/skeleton";

export default function SliderCollection({ isTitle = true }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const res = await fetch("/api/collection", {
          cache: "force-cache",
          next: { revalidate: 300 } // Cache for 5 minutes
        });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCollections(data);
        } else {
          setCollections([]);
        }
      } catch (error) {
        console.error("Failed to load collections:", error);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCollections();
  }, []);

  // Show skeleton while loading
  if (loading) {
    return (
      <section>
        <div className="container mx-auto px-4 md:px-20">
          {isTitle && (
            <div>
              <h2 className="text-lg md:text-2xl font-semibold mb-2 text-center">Explore Our Collections</h2>
              <p className="text-center text-xs md:text-sm md:mb-8 mb-4">Discover a wide range of collections tailored to your interests</p>
            </div>
          )}
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            className="collection-swiper hide-swiper-dots"
            breakpoints={{
              0: { slidesPerView: 3 },
              640: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              1024: { slidesPerView: 7 },
            }}
          >
            {[...Array(7)].map((_, index) => (
              <SwiperSlide key={index}>
                <div className="flex flex-col items-center">
                  <Skeleton className="md:w-28 md:h-28 w-24 h-24 rounded-full" />
                  <Skeleton className="w-20 h-4 mt-2 rounded" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>
    );
  }

  // Don't render if no collections
  if (collections.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="container mx-auto px-4 md:px-20">
        {isTitle && (
          <div>
            <h2 className="text-lg md:text-2xl font-semibold mb-2 text-center">Explore Our Collections</h2>
            <p className="text-center text-xs md:text-sm md:mb-8 mb-4">Discover a wide range of collections tailored to your interests</p>
          </div>
        )}

        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={20}
          loop
          pagination={{ clickable: true }}
          autoplay={{ delay: 2000, disableOnInteraction: false }}
          className="collection-swiper hide-swiper-dots"
          breakpoints={{
            0: { slidesPerView: 3 },
            640: { slidesPerView: 3 },
            768: { slidesPerView: 4 },
            1024: { slidesPerView: 7 },
          }}
        >
          {collections.map((collection) => (
            <SwiperSlide key={collection.id}>
              <Link href={`/products?collection=${collection.title}`}>
                <div className="flex flex-col items-center text-center">
                  <div className="md:w-28 md:h-28 w-24 h-24 rounded-full border border-blue-300 p-1 flex items-center justify-center shadow-sm transition-all duration-300 hover:shadow-md">
                    <img
                      src={collection.image || "https://placehold.co/100x100"}
                      alt={collection.title}
                      className="w-full h-full rounded-full object-cover object-center"
                    />
                  </div>
                  <p className="mt-2 md:text-sm text-xs font-medium text-gray-800 line-clamp-1">{collection.title}</p>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
