"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube, FaWhatsapp, FaEnvelope, FaPhone, FaMapMarkerAlt, FaPaperPlane, FaHeart } from "react-icons/fa";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [storeSettings, setStoreSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/setting?type=store", {
          cache: "force-cache",
          next: { revalidate: 300 } // Cache for 5 minutes
        });
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          setStoreSettings(data);
        }
      } catch (err) {
        console.error("Failed to load store settings:", err);
      }
    };

    fetchSettings();
  }, []);

  const handleSubscribe = useCallback(async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus("Subscribing...");

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: "news-latter", data: email }),
      });

      if (res.ok) {
        setStatus("✓ Successfully subscribed!");
        setEmail("");
        setTimeout(() => setStatus(""), 3000);
      } else {
        setStatus("✗ Subscription failed. Try again.");
      }
    } catch (error) {
      setStatus("✗ An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email]);

  // Parse footer links - memoized
  const parseLinks = useCallback((linksString) => {
    if (!linksString) return [];
    return linksString
      .split("\n")
      .filter((line) => line.trim() && line.includes("|"))
      .map((line) => {
        const [text, url] = line.split("|").map((s) => s.trim());
        return { text, url };
      });
  }, []);

  const column1Links = useMemo(() => parseLinks(storeSettings?.footerColumn1Links || ""), [storeSettings?.footerColumn1Links, parseLinks]);

  const socialLinks = useMemo(() => [
    {
      icon: <FaFacebookF />,
      url: storeSettings?.facebookUrl,
      gradient: "from-blue-600 to-blue-700",
      name: "Facebook",
    },
    {
      icon: <FaTwitter />,
      url: storeSettings?.twitterUrl,
      gradient: "from-sky-400 to-sky-600",
      name: "Twitter",
    },
    {
      icon: <FaInstagram />,
      url: storeSettings?.instagramUrl,
      gradient: "from-pink-500 to-purple-600",
      name: "Instagram",
    },
    {
      icon: <FaLinkedinIn />,
      url: storeSettings?.linkedinUrl,
      gradient: "from-blue-700 to-blue-800",
      name: "LinkedIn",
    },
    {
      icon: <FaYoutube />,
      url: storeSettings?.youtubeUrl,
      gradient: "from-red-500 to-red-600",
      name: "YouTube",
    },
    {
      icon: <FaWhatsapp />,
      url: storeSettings?.whatsappNumber ? `https://wa.me/${storeSettings.whatsappNumber}` : null,
      gradient: "from-green-500 to-green-600",
      name: "WhatsApp",
    },
  ].filter((link) => link.url), [storeSettings]);

  const storeName = useMemo(() => storeSettings?.footerTextLogo || storeSettings?.storeName || "Shop Gold", [storeSettings]);

  return (
    <footer className="relative bg-gray-50">
      {/* Main Footer Content */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 lg:justify-items-center">
            {/* Brand Section */}
            <div className="space-y-6 lg:justify-self-start">
              {/* Logo */}
              <div>
                {storeSettings?.footerLogo ? (
                  <img src={storeSettings.footerLogo} alt={storeName} className="h-8 w-auto object-contain" />
                ) : (
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-bold text-gray-900">{storeName}</h3>
                  </div>
                )}
              </div>

              {/* About */}
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-md">
                {storeSettings?.footerAbout || storeSettings?.websiteDescription || "Discover premium products with unmatched quality. Your satisfaction is our priority, and excellence is our standard."}
              </p>

              {/* Contact Info - Only show if at least one field has data */}
              {(storeSettings?.footerEmail || storeSettings?.footerPhone || storeSettings?.footerAddress) && (
                <div className="space-y-2">
                  {storeSettings?.footerEmail && (
                    <div className="flex items-center space-x-3 text-xs sm:text-sm text-gray-600">
                      <FaEnvelope className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <a href={`mailto:${storeSettings.footerEmail}`} className="hover:text-blue-600 transition-colors truncate">
                        {storeSettings.footerEmail}
                      </a>
                    </div>
                  )}
                  {storeSettings?.footerPhone && (
                    <div className="flex items-center space-x-3 text-xs sm:text-sm text-gray-600">
                      <FaPhone className="w-3 h-3 text-gray-400 flex-shrink-0 transform scale-x-[-1]" />
                      <a href={`tel:${storeSettings.footerPhone}`} className="hover:text-blue-600 transition-colors">
                        {storeSettings.footerPhone}
                      </a>
                    </div>
                  )}
                  {storeSettings?.footerAddress && (
                    <div className="flex items-start space-x-3 text-xs sm:text-sm text-gray-600">
                      <FaMapMarkerAlt className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{storeSettings.footerAddress}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Social Media */}
              {socialLinks.length > 0 && (
                <div className="flex items-center space-x-3">
                  {socialLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all duration-200"
                      title={link.name}
                    >
                      {link.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Company Pages - Dynamic 3 Column Grid */}
            {column1Links.length > 0 && (
              <div className="lg:justify-self-center w-full max-w-md mx-auto lg:mx-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4 text-center lg:text-left">{storeSettings?.footerColumn1Title || "Company"}</h3>
                <ul className="grid grid-cols-3 gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-3">
                  {column1Links.map((link, index) => (
                    <li key={index}>
                      <Link href={link.url} className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 block text-center lg:text-left">
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Newsletter Section - Stay Updated */}
            <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 relative overflow-hidden lg:justify-self-end w-full max-w-md lg:max-w-sm mx-auto lg:mx-0">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl translate-y-12 -translate-x-12"></div>

              <div className="relative">
                {/* Icon Badge */}
                <div className="flex gap-2 items-start justify-start mb-3">
                  <div className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex-shrink-0">
                    <FaPaperPlane className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>

                  {/* Heading */}
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-white mb-1 sm:mb-2">Stay Updated</h3>
                    <p className="text-xs text-white/90 leading-relaxed">Get exclusive deals and updates delivered to your inbox.</p>
                  </div>
                </div>

                {/* Newsletter Form */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3">
                  <form onSubmit={handleSubscribe} className="space-y-2.5 sm:space-y-3">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 sm:py-2.5 bg-white/20 backdrop-blur rounded-lg text-white text-xs sm:text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-50 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-xs sm:text-sm"
                    >
                      {loading ? (
                        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>Subscribe</span>
                          <FaPaperPlane className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </form>

                  {status && <p className={`mt-2 text-xs ${status.includes("✓") ? "text-green-200" : "text-red-200"}`}>{status}</p>}
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center justify-center space-x-2 sm:space-x-3 mt-3 text-[10px] sm:text-xs text-white/70">
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Secure</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>No spam</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Bottom Bar */}
      <div className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0">
            <p className="text-xs text-gray-500 text-center">{storeSettings?.copyrightText || `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
