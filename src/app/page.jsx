import React from "react";
import ProductGrid from "@/components/Product/ProductGrid";
import Slider from "@/components/Slider/Slider";
import SliderCollection from "@/components/Colleaction/SliderCollection";
import SupportBenefits from "@/components/SupportBenefits";
import CollectionBanner from "@/components/Colleaction/CollectionBanner";
import VideoReels from "@/components/VideoReels";

export default function Home() {
  return (
    <div className="pb-10">
      <div className="mt-1">
        <Slider />
      </div>
      <div className="md:mt-16 mt-2">
        <SliderCollection />
      </div>
      <div className="md:mt-16 mt-8">
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
