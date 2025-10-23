"use client";

import React, { useEffect, useState } from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import { Skeleton } from "@heroui/skeleton";

export default function TrustBadges() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const res = await fetch("/api/data?collection=support-benefits", {
          cache: "force-cache",
          next: { revalidate: 300 }
        });
        const data = await res.json();
        if (res.ok && data.length > 0) {
          const sorted = data.sort((a, b) => {
            const posA = a.position ?? 9999;
            const posB = b.position ?? 9999;
            return posA - posB;
          });
          setItems(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch support benefits", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBenefits();
  }, []);

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="container px-4 md:px-20 py-12 mx-auto">
        <div className="grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-8 text-center">
          {[1, 2, 3].map((index) => (
            <div key={index} className="flex flex-col items-center">
              <Skeleton className="w-8 h-8 md:w-14 md:h-14 rounded-full mb-2 md:mb-4" />
              <Skeleton className="h-3 md:h-4 w-20 md:w-32 mb-1 md:mb-2" />
              <Skeleton className="h-2 md:h-3 w-full max-w-[80px] md:max-w-xs" />
              <Skeleton className="h-2 md:h-3 w-full max-w-[60px] md:max-w-xs mt-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Don't render if no items
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="container px-4 md:px-20 py-12 mx-auto">
      <div className="grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-8 text-center">
        {items.map((item, index) => (
          <div key={item._id || index}>
            <div className="flex justify-center text-black mb-2 md:mb-4">
              <DynamicIcon name={item.iconName || "package-check"} size={20} className="md:w-7 md:h-7" />
            </div>
            <h3 className="text-xs md:text-sm font-semibold mb-1 md:mb-2 line-clamp-2 overflow-hidden text-ellipsis">{item.title}</h3>
            <p className="text-xs md:text-sm text-gray-600 line-clamp-2 overflow-hidden text-ellipsis">{item.description}</p>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
