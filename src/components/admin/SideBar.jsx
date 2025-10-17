"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  Home,
  Tags,
  Plus,
  LayoutGrid,
  CreditCard,
  FileText,
  ShoppingCart,
  Menu,
  Layers,
  Mail,
  BarChart2,
  Settings,
  GalleryHorizontalEnd,
  LogOut,
  Video,
  Wallet,
  Code,
  HelpCircle,
  BookOpen,
} from "lucide-react";

const SideBar = ({ onItemClick }) => {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/admin", icon: <Home size={16} />, label: "Dashboard" },
    { href: "/admin/product", icon: <Tags size={16} />, label: "Products" },
    { href: "/admin/product/new", icon: <Plus size={16} />, label: "Add Product" },
    { href: "/admin/collection", icon: <LayoutGrid size={16} />, label: "Collections" },
    { href: "/admin/orders", icon: <ShoppingCart size={16} />, label: "Orders" },
    { href: "/admin/payment", icon: <CreditCard size={16} />, label: "Payments" },
    { href: "/admin/contact", icon: <Mail size={16} />, label: "Contact" },
    { href: "/admin/faqs", icon: <HelpCircle size={16} />, label: "FAQs" },
    { href: "/admin/analytics", icon: <BarChart2 size={16} />, label: "Analytics" },
    { href: "/admin/images", icon: <GalleryHorizontalEnd size={16} />, label: "Media" },
    { href: "/admin/slider", icon: <Layers size={16} />, label: "Sliders" },
    { href: "/admin/reel", icon: <Video size={16} />, label: "Reels" },
    { href: "/admin/menu", icon: <Menu size={16} />, label: "Menus" },
    { href: "/admin/news-latter", icon: <Mail size={16} />, label: "Newsletter" },
    { href: "/admin/settings", icon: <Settings size={16} />, label: "Store Settings" },
    { href: "/admin/payment-gateway", icon: <Wallet size={16} />, label: "Payment Gateway" },
    { href: "/admin/app-integrations", icon: <Code size={16} />, label: "App Integrations" },
  ];

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "DELETE" });
    router.push("/login");
    if (onItemClick) onItemClick(); // Close mobile sidebar
  };

  const handleLinkClick = () => {
    if (onItemClick) onItemClick(); // Close mobile sidebar when navigating
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {links.map(({ href, icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href} onClick={handleLinkClick}>
              <div
                className={`group mb-2 flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm"
                }`}
              >
                <span className={`transition-colors ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`}>{icon}</span>
                <span className="truncate">{label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full opacity-70"></div>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="group flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut size={16} className="text-gray-400 group-hover:text-red-500 transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default SideBar;
