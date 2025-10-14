"use client";

import React from "react";
import { PackageCheck, BadgeCheck, MessageCircle } from "lucide-react";

const items = [
  {
    icon: <PackageCheck size={28} />,
    title: "Free Shipping",
    description: "Enjoy free worldwide shipping and returns, with customs and duties taxes included.",
  },
  {
    icon: <BadgeCheck size={28} />,
    title: "Free Returns",
    description: "Free returns within 15 days, please make sure the items are in undamaged condition.",
  },
  {
    icon: <MessageCircle size={28} />,
    title: "Support Online",
    description: "We support customers 24/7, send questions we will solve for you immediately.",
  },
];

export default function TrustBadges() {
  return (
    <div className=" container px-4 md:px-20 py-12 mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {items.map((item, index) => (
          <div key={index}>
            <div className="flex justify-center text-black mb-4">{item.icon}</div>
            <h3 className="text-xs sm:text-sm font-semibold mb-2">{item.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
