"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiMenu3Line } from "react-icons/ri";
import { DynamicIcon } from "lucide-react/dynamic";
import { ShoppingCart, Search, Heart } from "lucide-react";
import Link from "next/link";

export default function FullHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize wishlist update function
  const updateWishlistCount = useCallback(() => {
    const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setWishlistCount(savedWishlist.length);
  }, []);

  useEffect(() => {
    // Use Promise.all to fetch data in parallel
    const fetchData = async () => {
      try {
        const [menuRes, settingsRes] = await Promise.all([fetch("/api/data?collection=menu-item", {}), fetch("/api/setting?type=store", {})]);

        if (menuRes.ok) {
          const menuData = await menuRes.json();
          const sorted = [...menuData].sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999));
          setMenuItems(sorted);
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData && Object.keys(settingsData).length > 0) {
            setStoreSettings(settingsData);
          }
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    updateWishlistCount();

    // Listen for wishlist updates
    window.addEventListener("storage", updateWishlistCount);
    window.addEventListener("wishlistUpdated", updateWishlistCount);

    return () => {
      window.removeEventListener("storage", updateWishlistCount);
      window.removeEventListener("wishlistUpdated", updateWishlistCount);
    };
  }, [updateWishlistCount]);

  // Memoize derived values
  const logoSrc = useMemo(() => storeSettings?.logoImage || "/logonc.svg", [storeSettings?.logoImage]);
  const storeName = useMemo(() => storeSettings?.textLogo || storeSettings?.storeName || "", [storeSettings]);
  const displayMenuItems = useMemo(() => menuItems, [menuItems]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header className="w-full text-sm bg-white shadow sticky top-0 z-40">
        <div className="container mx-auto flex items-center h-12 px-2 md:px-20">
          {/* Mobile: Menu button on left - Always show */}
          <button onClick={() => setMenuOpen(true)} className="text-black text-xl p-2 cursor-pointer md:hidden">
            <RiMenu3Line />
          </button>

          {/* Logo - Centered on mobile, left on desktop */}
          <Link href={"/"} className="flex items-center">
            {storeSettings?.logoImage ? <img src={logoSrc} alt={storeName} className="h-8 w-auto" /> : <span className="font-bold text-lg">{storeName}</span>}
          </Link>

          {/* Desktop Menu - Centered */}
          <nav className="hidden md:flex gap-4 items-center justify-center flex-1">
       

            {/* Dynamic Menu Items */}
            {displayMenuItems.map(({ _id, title, url }) => (
              <a key={_id} href={url} className="flex items-center gap-1 text-sm capitalize hover:text-orange-500 transition-colors">
                <p className="capitalize">{title}</p>
              </a>
            ))}
          </nav>

          {/* Search + Wishlist + Cart */}
          <div className="flex gap-1 items-center ml-auto">
            <Link href="/products" className="text-black p-2 cursor-pointer hover:text-orange-500 transition-colors" prefetch={true}>
              <Search className="w-5 h-5" />
            </Link>
            <Link href="/wishlist" className="text-black p-2 cursor-pointer relative hover:text-orange-500 transition-colors" prefetch={true}>
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{wishlistCount}</span>}
            </Link>
            <Link href="/cart" className="text-black p-2 cursor-pointer hover:text-orange-500 transition-colors" prefetch={true}>
              <ShoppingCart className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50" onClick={() => setMenuOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

            <motion.div
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-50 flex flex-col overflow-y-auto"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
            >
              {/* Header Section with Logo and Close Button */}
              <div className="relative bg-gray-50 border-b border-gray-200 px-4 py-6 pt-8">
                <button
                  onClick={closeMenu}
                  className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl cursor-pointer z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                >
                  ×
                </button>

                {/* Logo/Store Name */}
                <div className="flex items-center gap-3 pr-12">
                  {storeSettings?.logoImage ? <img src={logoSrc} alt={storeName} className="h-8 w-auto" /> : <span className="font-bold text-lg text-gray-800">{storeName}</span>}
                </div>

                {/* Welcome text */}
                <p className="text-xs text-gray-500 mt-2">Navigate through our store</p>
              </div>

              {/* Mobile Menu List */}
              <div className="flex flex-col px-4 py-6 gap-1 flex-1">
                {/* Blog Link - Always show in mobile */}
                <Link href="/blog" className="flex items-center justify-between py-4 px-3 rounded-lg hover:bg-gray-50 transition-colors group border-b border-gray-100" onClick={closeMenu}>
                  <div className="flex items-center gap-4 text-gray-700 text-sm font-medium group-hover:text-gray-900">
                    <span className="text-gray-500 group-hover:text-blue-600 transition-colors">
                      <DynamicIcon name="book-open" size={20} />
                    </span>
                    <span className="capitalize">Blog</span>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    <DynamicIcon name="chevron-right" size={16} />
                  </span>
                </Link>

                {displayMenuItems.length > 0 ? (
                  displayMenuItems.map(({ _id, title, url, iconName, badge }) => (
                    <a
                      href={url}
                      key={_id}
                      className="flex items-center justify-between py-4 px-3 rounded-lg hover:bg-gray-50 transition-colors group border-b border-gray-100 last:border-b-0"
                      onClick={closeMenu}
                    >
                      <div className="flex items-center gap-4 text-gray-700 text-sm font-medium group-hover:text-gray-900">
                        <span className="text-gray-500 group-hover:text-blue-600 transition-colors">
                          <DynamicIcon name={iconName || "help-circle"} size={20} />
                        </span>
                        <span className="capitalize">{title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {badge && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">{badge}</span>}
                        <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                          <DynamicIcon name="chevron-right" size={16} />
                        </span>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-gray-300 mb-4">
                      <RiMenu3Line className="text-5xl" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No menu items available</p>
                    <p className="text-gray-400 text-xs mt-2 max-w-48">Add menu items from the admin panel to display navigation options</p>
                  </div>
                )}
              </div>

              {/* Footer Section */}
              {displayMenuItems.length > 0 && (
                <div className="border-t border-gray-200 px-4 py-4 bg-gray-50">
                  <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                    <span>
                      © {new Date().getFullYear()} {storeName}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
