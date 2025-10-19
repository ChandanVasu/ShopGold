import { Rubik } from "next/font/google"; // Changed from Poppins to Rubik
import "./globals.css";
import { Providers } from "./providers";
import "suneditor/dist/css/suneditor.min.css";
import MainFooterWrapper from "@/components/template/MainFooterWrapper";
import MainHeaderWrapper from "@/components/template/MainHeaderWrapper";
import ScriptInjector from "@/components/ScriptInjector";
import { getStoreSettings } from "@/lib/getStoreSettings";

// Load the Rubik font with CSS variable support
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Generate metadata dynamically from store settings
export async function generateMetadata() {
  const settings = await getStoreSettings();
  
  return {
    title: settings?.storeName || "Shop Gold - Online Shopping Experience",
    description: settings?.websiteDescription || "Shop Gold is a modern online shopping experience built with Next.js",
    icons: {
      icon: settings?.faviconImage || "/favicon.ico",
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={rubik.variable}>
      <head>
        {/* Meta tags and other head elements will be handled by Next.js */}
      </head>
      <body className="antialiased">
        <Providers>
          <ScriptInjector />
          <MainHeaderWrapper />
          {children}
          <MainFooterWrapper />
        </Providers>
      </body>
    </html>
  );
}
