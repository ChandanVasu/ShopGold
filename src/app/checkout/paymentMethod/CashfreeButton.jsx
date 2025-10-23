"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { CreditCard, Loader2 } from "lucide-react";

export default function CashfreeButton({ amount, currency, orderData, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const loadCashfreeCheckout = () => {
    return new Promise((resolve) => {
      if (window.Cashfree) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      // Use latest Cashfree Checkout.js
      script.src = "https://sdk.cashfree.com/js/v3/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Load Cashfree Checkout script
      const scriptLoaded = await loadCashfreeCheckout();
      if (!scriptLoaded) {
        throw new Error("Failed to load Cashfree checkout script");
      }

      // Create order on backend
      const orderResponse = await fetch("/api/payment/cashfree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency, orderData }),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        throw new Error(orderResult.error || "Failed to create order");
      }

      // Configure Cashfree Checkout
      const cashfree = new window.Cashfree({
        mode: "sandbox", // Change to "production" for live
      });

      // Checkout options for the latest API
      const checkoutOptions = {
        paymentSessionId: orderResult.paymentSessionId,
        redirectTarget: "_modal", // Opens in modal
      };

      // Handle payment result with the latest Checkout.js
      cashfree.checkout(checkoutOptions).then(async (result) => {
        if (result.error) {
          console.error("Cashfree payment error:", result.error);
          onError && onError(result.error.message || "Payment failed");
          setLoading(false);
          return;
        }

        // Check if payment was successful
        if (result.redirect || result.paymentDetails) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch("/api/payment/cashfree", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: orderResult.orderId,
                dbOrderId: orderResult.dbOrderId,
              }),
            });

            const verifyResult = await verifyResponse.json();

            if (verifyResult.success) {
              onSuccess && onSuccess(verifyResult.order);
            } else {
              throw new Error(verifyResult.error || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            onError && onError(error.message);
          }
        }

        setLoading(false);
      }).catch((error) => {
        console.error("Cashfree checkout error:", error);
        onError && onError(error.message || "Payment initialization failed");
        setLoading(false);
      });

    } catch (error) {
      console.error("Cashfree payment error:", error);
      onError && onError(error.message);
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg transition-colors"
      startContent={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
    >
      {loading ? "Processing..." : `Pay ₹${amount} with Cashfree`}
    </Button>
  );
}