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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[1, 2, 3].map((index) => (
            <div key={index} className="flex flex-col items-center">
              <Skeleton className="w-14 h-14 rounded-full mb-4" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-full max-w-xs" />
              <Skeleton className="h-3 w-full max-w-xs mt-1" />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {items.map((item, index) => (
          <div key={item._id || index}>
            <div className="flex justify-center text-black mb-4">
              <DynamicIcon name={item.iconName || "package-check"} size={28} />
            </div>
            <h3 className="text-xs sm:text-sm font-semibold mb-2">{item.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
