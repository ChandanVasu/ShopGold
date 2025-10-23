"use client";

import React, { useEffect, useState } from "react";
import ProductGrid from "@/components/Product/ProductGrid";
import Slider from "@/components/Slider/Slider";
import SliderCollection from "@/components/Colleaction/SliderCollection";
import SupportBenefits from "@/components/SupportBenefits";
import CollectionBanner from "@/components/Colleaction/CollectionBanner";
import VideoReels from "@/components/VideoReels";

export default function Home() {
  const [topOfferBanner, setTopOfferBanner] = useState(null);

  useEffect(() => {
    const fetchTopOfferBanner = async () => {
      try {
        const res = await fetch("/api/data?collection=top-offer-banner");
        const data = await res.json();
        if (res.ok && data.length > 0) {
          setTopOfferBanner(data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch top offer banner", err);
      }
    };

    fetchTopOfferBanner();
  }, []);

  return (
    <div className="pb-10">
      {topOfferBanner?.image && (
        <a href={topOfferBanner.url || "#"} className="block">
          <img className="w-full md:h-[80px]" src={topOfferBanner.image} alt={topOfferBanner.title || "Top Offer"} />
        </a>
      )}
      <div className="mt-3">
        <Slider />
      </div>
      <div className="md:mt-16 mt-8">
        <SliderCollection />
      </div>
      <div className="md:mt-16 mt-10">
        <ProductGrid />
      </div>
      <div className="md:mt-16 mt-8">
        <VideoReels />
      </div>
      <div className="md:mt-6 mt-4">
        <SupportBenefits />
      </div>
    </div>
  );
}
