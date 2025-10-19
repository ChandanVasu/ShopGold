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
        
        if (data?.stripe?.enabled && data?.stripe?.publishableKey) {
          const stripe = loadStripe(data.stripe.publishableKey);
          setStripePromise(stripe);
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
        <Spinner color="secondary" size="lg" />
      </div>
    );
  }

  // PayPal configuration
  const paypalOptions = {
    "client-id": paymentSettings?.paypal?.clientId || "test",
    currency: "USD",
    intent: "capture",
  };

  // Wrap with PayPal provider first, then Stripe
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
