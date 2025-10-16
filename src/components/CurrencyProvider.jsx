"use client";

import { useEffect } from "react";

export default function CurrencyProvider({ children }) {
  useEffect(() => {
    // Cache currency and store settings
    const cacheStoreSettings = async () => {
      try {
        const res = await fetch("/api/setting?type=store");
        const data = await res.json();
        
        if (data) {
          // Cache currency settings
          const currencyData = {
            currency: data.storeCurrency || "USD",
            symbol: data.currencySymbol || "$",
            lastUpdated: new Date().toISOString()
          };
          
          // Store in localStorage for quick access
          localStorage.setItem("store_currency", JSON.stringify(currencyData));
          localStorage.setItem("store_settings", JSON.stringify(data));
          
          // Set global CSS variables for currency
          document.documentElement.style.setProperty('--store-currency', data.storeCurrency || 'USD');
          document.documentElement.style.setProperty('--currency-symbol', data.currencySymbol || '$');
          
          console.log("Currency cached:", currencyData);
        }
      } catch (error) {
        console.error("Failed to cache store settings:", error);
        // Set defaults if API fails
        const defaultCurrency = {
          currency: "USD",
          symbol: "$",
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem("store_currency", JSON.stringify(defaultCurrency));
        document.documentElement.style.setProperty('--store-currency', 'USD');
        document.documentElement.style.setProperty('--currency-symbol', '$');
      }
    };

    // Check if data is already cached and fresh (less than 1 hour old)
    const cachedCurrency = localStorage.getItem("store_currency");
    if (cachedCurrency) {
      try {
        const parsed = JSON.parse(cachedCurrency);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const lastUpdated = new Date(parsed.lastUpdated);
        
        if (lastUpdated > oneHourAgo) {
          // Use cached data if it's fresh
          document.documentElement.style.setProperty('--store-currency', parsed.currency);
          document.documentElement.style.setProperty('--currency-symbol', parsed.symbol);
          console.log("Using cached currency:", parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to parse cached currency:", e);
      }
    }

    // Cache is stale or doesn't exist, fetch fresh data
    cacheStoreSettings();
  }, []);

  return <>{children}</>;
}