"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiMenu3Line } from "react-icons/ri";
import { DynamicIcon } from "lucide-react/dynamic";
import { ShoppingCart, Search, Heart } from "lucide-react";
import Link from "next/link";

// Fallback menu items
const FALLBACK_MENU_ITEMS = [
  { _id: "fallback-1", title: "Home", url: "/", iconName: "home" },
  { _id: "fallback-2", title: "Products", url: "/products", iconName: "shopping-bag" },
  { _id: "fallback-3", title: "About", url: "/about", iconName: "info" },
  { _id: "fallback-4", title: "Contact", url: "/contact", iconName: "phone" },
];

export default function FullHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch("/api/data?collection=menu-item");
        const data = await res.json();
        if (res.ok) {
          // Sort & clean positions
          const sorted = [...data].sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999));
          setMenuItems(sorted);
        }
      } catch (err) {
        console.error("Failed to load menu items:", err);
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/setting?type=store");
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          setStoreSettings(data);
        }
      } catch (err) {
        console.error("Failed to load store settings:", err);
      }
    };

    fetchMenu();
    fetchSettings();

    // Load wishlist count
    const updateWishlistCount = () => {
      const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWishlistCount(savedWishlist.length);
    };

    updateWishlistCount();

    // Listen for storage changes
    window.addEventListener("storage", updateWishlistCount);
    
    // Custom event for same-page wishlist updates
    window.addEventListener("wishlistUpdated", updateWishlistCount);

    return () => {
      window.removeEventListener("storage", updateWishlistCount);
      window.removeEventListener("wishlistUpdated", updateWishlistCount);
    };
  }, []);

  const logoSrc = storeSettings?.logoImage || "/logonc.svg";
  const storeName = storeSettings?.textLogo || storeSettings?.storeName || "Shop Gold";
  
  // Use fallback menu if no menu items are available
  const displayMenuItems = menuItems.length > 0 ? menuItems : FALLBACK_MENU_ITEMS;

  return (
    <>
      <header className="w-full text-sm bg-white shadow sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between h-12 px-4 md:px-20">
          {/* Mobile: Menu button on left - Only show if menu items exist */}
          {menuItems.length > 0 && (
            <div className="flex items-center gap-2 md:hidden">
              <button onClick={() => setMenuOpen(true)} className="text-black text-xl p-2 cursor-pointer">
                <RiMenu3Line />
              </button>
            </div>
          )}

          <Link href={"/"} className={`flex items-center ${menuItems.length > 0 ? 'absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none' : ''}`}>
            {storeSettings?.logoImage ? (
              <img src={logoSrc} alt={storeName} className="h-8 w-auto" />
            ) : (
              <span className="font-bold text-lg">{storeName}</span>
            )}
          </Link>

          {/* Desktop Menu - Only show if menu items exist */}
          {menuItems.length > 0 && (
            <nav className="hidden md:flex gap-4 items-center">
              {menuItems.map(({ _id, title, url }) => (
                <a key={_id} href={url} className="flex items-center gap-1 text-sm capitalize">
                  <p className="capitalize">{title}</p>
                </a>
              ))}
            </nav>
          )}

          {/* Search + Wishlist + Cart */}
          <div className="flex gap-1 items-center justify-end">
            <Link href="/products" className="text-black p-2 cursor-pointer">
              <Search className="w-5 h-5" />
            </Link>
            <Link href="/wishlist" className="text-black p-2 cursor-pointer relative">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link href="/cart" className="text-black p-2 cursor-pointer">
              <ShoppingCart className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50"
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-50 flex flex-col overflow-y-auto"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
            >
              {/* Banner */}
              <div className="relative w-full">
                <img src="/menu_banner.jpg" alt="Banner" className="w-full h-auto" />
                <button onClick={() => setMenuOpen(false)} className="absolute top-2 right-2 text-white text-xl cursor-pointer">
                  ×
                </button>
              </div>

              {/* Mobile Menu List */}
              <div className="flex flex-col px-4 py-4 gap-3">
                {displayMenuItems.map(({ _id, title, url, iconName, badge }) => (
                  <a href={url} key={_id} className="flex items-center justify-between py-3 border-b" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center gap-3 text-gray-800 text-sm font-medium">
                      <span className="text-lg text-gray-600">
                        <DynamicIcon name={iconName || "help-circle"} size={18} />
                      </span>
                      {title}
                    </div>
                    {badge && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">{badge}</span>}
                  </a>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
