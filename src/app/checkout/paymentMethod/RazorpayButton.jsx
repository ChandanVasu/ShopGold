"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { CreditCard, Loader2 } from "lucide-react";

export default function RazorpayButton({ amount, currency, orderData, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay script");
      }

      // Create order on backend
      const orderResponse = await fetch("/api/payment/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency, orderData }),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        throw new Error(orderResult.error || "Failed to create order");
      }

      // Configure Razorpay options
      const options = {
        key: orderResult.keyId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        name: "Shop Gold",
        description: "Shop Gold Purchase",
        order_id: orderResult.orderId,
        handler: async (response) => {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch("/api/payment/razorpay", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
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
        },
        prefill: {
          name: orderData.name,
          email: orderData.email,
          contact: orderData.phone,
        },
        notes: {
          address: orderData.address || "",
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            onError && onError("Payment cancelled by user");
          },
        },
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Razorpay payment error:", error);
      onError && onError(error.message);
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
      startContent={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
    >
      {loading ? "Processing..." : `Pay ₹${amount} with Razorpay`}
    </Button>
  );
}