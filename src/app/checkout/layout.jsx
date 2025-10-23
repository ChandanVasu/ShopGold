"use client";
import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Spinner } from "@heroui/react";
import PaymentContext from "./PaymentContext";

export default function CheckoutLayout({ children }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const res = await fetch("/api/setting?type=payment", {
          cache: "force-cache",
          next: { revalidate: 300 }
        });
        const data = await res.json();
        setPaymentSettings(data);
        
        // Load Stripe if enabled and configured
        if (data?.stripe?.enabled && data?.stripe?.publishableKey) {
          const stripe = loadStripe(data.stripe.publishableKey);
          setStripePromise(stripe);
        }

        // Preload Razorpay script if enabled and properly configured
        if (data?.razorpay?.enabled && data?.razorpay?.keyId && data?.razorpay?.keySecret) {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          document.body.appendChild(script);
        }

        // Preload Cashfree script if enabled and properly configured
        if (data?.cashfree?.enabled && data?.cashfree?.appId && data?.cashfree?.secretKey) {
          const script = document.createElement("script");
          script.src = "https://sdk.cashfree.com/js/v3/checkout.js";
          script.async = true;
          document.head.appendChild(script);
        }

      } catch (err) {
        console.error("Failed to load payment settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Spinner color="secondary" size="lg" />
          <p className="mt-4 text-gray-600">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  // PayPal configuration
  const paypalOptions = {
    "client-id": paymentSettings?.paypal?.clientId || "test",
    currency: "USD",
    intent: "capture",
    "disable-funding": "credit,card",
  };

  return (
    <PaymentContext.Provider value={paymentSettings}>
      <PayPalScriptProvider options={paypalOptions}>
        <Elements stripe={stripePromise}>
          {children}
        </Elements>
      </PayPalScriptProvider>
    </PaymentContext.Provider>
  );
}
