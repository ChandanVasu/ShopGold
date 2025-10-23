"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductGallery({ images = [], title = "" }) {
  const [selectedImage, setSelectedImage] = useState(images?.[0] || "");
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    setSelectedImage(images?.[0] || "");
    setCurrentIndex(0);
  }, [images]);

  const scrollToImage = (index) => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const imageWidth = scrollContainer.clientWidth;
      scrollContainer.scrollTo({
        left: index * imageWidth,
        behavior: 'smooth'
      });
    }
    setCurrentIndex(index);
    setSelectedImage(images[index]);
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const imageWidth = scrollContainer.clientWidth;
      const scrollLeft = scrollContainer.scrollLeft;
      const newIndex = Math.round(scrollLeft / imageWidth);
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < images.length) {
        setCurrentIndex(newIndex);
        setSelectedImage(images[newIndex]);
      }
    }
  };

  const previousImage = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    scrollToImage(newIndex);
  };

  const nextImage = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    scrollToImage(newIndex);
  };

  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-100 rounded-xl flex-1 h-[400px] md:h-[500px] flex items-center justify-center">
        <span className="text-gray-400 text-lg">No images available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Mobile: Scrollable Image Gallery */}
      <div className="block md:hidden relative">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {images.map((img, i) => (
            <div key={i} className="w-full flex-shrink-0 snap-center">
              <img 
                src={img} 
                alt={`${title} ${i + 1}`} 
                className="w-full h-[400px] object-cover object-top rounded-xl bg-gray-100" 
              />
            </div>
          ))}
        </div>
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button 
              onClick={previousImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToImage(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? "bg-gray-800" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Traditional Gallery */}
      <div className="hidden md:flex md:flex-row gap-4">
        <div className="bg-gray-100 rounded-xl flex-1 h-min">
          <img 
            src={selectedImage} 
            alt={title} 
            className="w-full h-[400px] md:h-[500px] object-cover object-top rounded-xl" 
          />
        </div>
        <div className="flex gap-2 overflow-y-auto md:overflow-visible md:flex-col hide-scrollbar max-h-[500px]">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Thumb ${i}`}
              onClick={() => setSelectedImage(img)}
              className={`w-20 h-20 object-cover rounded-lg border-2 cursor-pointer flex-shrink-0 transition bg-gray-100 hover:border-gray-400 ${
                selectedImage === img ? "border-gray-800" : "border-gray-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
