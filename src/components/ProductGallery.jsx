"use client";
import React, { useState } from "react";

export default function ProductGallery({ images = [], title = "" }) {
  const [selectedImage, setSelectedImage] = useState(images?.[0] || "");

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="bg-gray-100 rounded-xl flex-1 h-min">
        <img src={selectedImage} alt={title} className="w-full h-[400px] md:h-[500px] object-cover object-top rounded-xl" />
      </div>
      <div className="flex gap-2 mt-4 md:mt-0 overflow-x-auto md:overflow-visible md:flex-col hide-scrollbar">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Thumb ${i}`}
            onClick={() => setSelectedImage(img)}
            className={`w-20 h-20 object-cover rounded-lg border-b-2 cursor-pointer flex-shrink-0 transition bg-gray-100 ${
              selectedImage === img ? "border-indigo-500" : "border-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
