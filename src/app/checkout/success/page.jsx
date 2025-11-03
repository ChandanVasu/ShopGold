"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Package, Truck, Clock, Home, ShoppingBag, User, MapPin, CreditCard } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

function SuccessContent() {
  const searchParams = useSearchParams();
  const { symbol: currencySymbol, currency } = useCurrency();

  // Get various possible order identifiers from URL
  const sessionId = searchParams.get("sessionId") || searchParams.get("session_id") || searchParams.get("orderId") || searchParams.get("order_id");
  const token = searchParams.get("token");
  const paymentIntentId = searchParams.get("payment_intent");
  const razorpayOrderId = searchParams.get("razorpay_order_id");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [sessionId, token, paymentIntentId, razorpayOrderId]);

  const fetchOrderDetails = async () => {
    // Debug: Log all URL parameters
    console.log("Success page URL parameters:", {
      sessionId,
      token,
      paymentIntentId,
      razorpayOrderId,
      allParams: Object.fromEntries(searchParams.entries()),
    });

    // Try to get order ID from multiple sources
    const orderSources = [
      sessionId,
      token,
      paymentIntentId,
      razorpayOrderId,
      searchParams.get("order_id"),
      searchParams.get("orderId"),
      searchParams.get("paypal_order_id"),
      searchParams.get("cashfree_order_id"),
      localStorage.getItem("lastOrderId"),
      localStorage.getItem("pendingOrderId"),
    ].filter(Boolean);

    console.log("Order sources to try:", orderSources);

    if (orderSources.length === 0) {
      console.log("No order identifiers found");
      setLoading(false);
      return;
    }

    try {
      // Try each order source until we find a match
      for (const orderId of orderSources) {
        try {
          console.log(`Trying to fetch order with ID: ${orderId}`);

          const params = new URLSearchParams();
          params.append("orderId", orderId);

          const res = await fetch(`/api/order?${params.toString()}`);
          const data = await res.json();

          console.log(`API response for ${orderId}:`, { status: res.status, dataLength: Array.isArray(data) ? data.length : "not array", data });

          if (res.ok && Array.isArray(data) && data.length > 0) {
            // Find the most recent order or exact match
            const foundOrder =
              data.find(
                (order) =>
                  order.sessionId === orderId ||
                  order._id === orderId ||
                  order.paymentDetails?.paymentIntentId === orderId ||
                  order.paymentDetails?.razorpayOrderId === orderId ||
                  order.paymentDetails?.paypalOrderId === orderId ||
                  order.paymentDetails?.cashfreeOrderId === orderId
              ) || data[0]; // Fallback to first order if no exact match

            if (foundOrder) {
              setOrder(foundOrder);
              // Store the order ID for future reference
              localStorage.setItem("lastOrderId", foundOrder._id);
              console.log("Order found and set:", foundOrder._id);
              return;
            }
          }
        } catch (err) {
          console.log(`Failed to fetch with ID ${orderId}:`, err.message);
          continue;
        }
      }

      // If no order found with any ID, try to get the most recent order
      try {
        console.log("Trying to fetch most recent order...");
        const res = await fetch("/api/order?limit=1&sort=desc");
        const data = await res.json();

        if (res.ok && Array.isArray(data) && data.length > 0) {
          const recentOrder = data[0];
          // Only use recent order if it's within the last 30 minutes
          const orderTime = new Date(recentOrder.createdAt).getTime();
          const currentTime = new Date().getTime();
          const timeDiff = (currentTime - orderTime) / (1000 * 60); // minutes

          console.log(`Recent order time diff: ${timeDiff} minutes`);

          if (timeDiff <= 30) {
            setOrder(recentOrder);
            console.log("Using recent order within 30 minutes:", recentOrder._id);
          } else {
            console.log("Recent order is too old, not using it");
          }
        }
      } catch (err) {
        console.error("Failed to fetch recent orders:", err);
      }
    } catch (err) {
      console.error("Failed to fetch order details:", err);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatus = (orderDate) => {
    if (!orderDate) return { status: "pending", message: "Order will be dispatch soon" };

    const orderTime = new Date(orderDate).getTime();
    const currentTime = new Date().getTime();
    const hoursElapsed = (currentTime - orderTime) / (1000 * 60 * 60);

    if (hoursElapsed < 24) {
      return {
        status: "pending",
        message: "Order will be dispatch soon",
        statusIndex: 0,
      };
    } else if (hoursElapsed < 48) {
      return {
        status: "dispatched",
        message: "Your order has been dispatched",
        statusIndex: 1,
      };
    } else if (hoursElapsed < 96) {
      return {
        status: "in-transit",
        message: "Your order is in transit",
        statusIndex: 2,
      };
    } else if (hoursElapsed < 120) {
      return {
        status: "out-for-delivery",
        message: "Your order is out for delivery",
        statusIndex: 3,
      };
    } else {
      return {
        status: "delivered",
        message: "Your order has been delivered",
        statusIndex: 4,
      };
    }
  };

  const statusSteps = [
    { label: "Order Placed", icon: CheckCircle, status: "pending" },
    { label: "Dispatched", icon: Package, status: "dispatched" },
    { label: "In Transit", icon: Truck, status: "in-transit" },
    { label: "Out for Delivery", icon: Clock, status: "out-for-delivery" },
    { label: "Delivered", icon: Home, status: "delivered" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white px-4">
        <div className="text-center">
          <Package className="w-6 h-6 md:w-8 md:h-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-600 text-sm md:text-base">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-6 md:py-12 px-3 md:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-6 md:mb-8">
          <CheckCircle className="mx-auto h-12 w-12 md:h-20 md:w-20 text-green-500 mb-3 md:mb-4 animate-bounce" />
          <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 md:mb-2">Order Confirmation</h1>
          <p className="text-sm md:text-lg text-gray-600 mb-3 md:mb-4">Thank you for your purchase! Your order has been confirmed.</p>
          <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium">
            <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Payment Successful
          </div>
        </div>

        {/* Order Details */}
        {order ? (
          <div className="bg-white rounded-xl md:rounded-2xl  p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
            {/* Order Info Header */}
            <div className="border-b pb-4 md:pb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">Order #{order.sessionId || order._id}</h2>
                  <p className="text-sm md:text-base text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs md:text-sm text-gray-600">Total Amount</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">
                    {order.paymentDetails?.currencySymbol || currencySymbol}
                    {order.paymentDetails?.total}
                  </p>
                </div>
              </div>

              {/* Current Status */}
              {(() => {
                const currentStatus = getOrderStatus(order.createdAt);
                return (
                  <div className="mt-3 md:mt-4 p-3 md:p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-800 font-medium text-center text-sm md:text-base">{currentStatus.message}</p>
                  </div>
                );
              })()}
            </div>

            {/* Order Status Timeline */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                <Package className="w-4 h-4 md:w-5 md:h-5" />
                Order Status
              </h3>
              <div className="space-y-3 md:space-y-4">
                {statusSteps.map((step, index) => {
                  const currentStatus = getOrderStatus(order.createdAt);
                  const isCompleted = index < currentStatus.statusIndex;
                  const isCurrent = index === currentStatus.statusIndex;
                  const Icon = step.icon;

                  return (
                    <div key={index} className="flex items-center">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted || isCurrent ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                        <Icon className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div className="ml-3 md:ml-4 flex-1">
                        <p className={`font-medium text-sm md:text-base ${isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                        {isCurrent && <p className="text-xs md:text-sm text-green-600">Current Status</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer & Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 md:p-6">
                <h3 className="font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                  <User className="w-4 h-4" />
                  Customer Information
                </h3>
                <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
                  <p>
                    <span className="font-medium">Name:</span> {order.name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {order.email}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span> {order.phone}
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shipping?.address && (
                <div className="bg-gray-50 rounded-lg p-4 md:p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                    <MapPin className="w-4 h-4" />
                    Shipping Address
                  </h3>
                  <div className="text-xs md:text-sm text-gray-700">
                    <p>{order.shipping.address.address1}</p>
                    {order.shipping.address.address2 && <p>{order.shipping.address.address2}</p>}
                    <p>
                      {order.shipping.address.city}, {order.shipping.address.state}
                    </p>
                    <p>
                      {order.shipping.address.country} - {order.shipping.address.zip}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-gray-50 rounded-lg p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                <CreditCard className="w-4 h-4" />
                Payment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-xs md:text-sm">
                <div>
                  <span className="font-medium text-gray-600">Payment Method:</span>
                  <p className="capitalize">{order.paymentDetails?.paymentMethod || "Online Payment"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <p className="text-green-600 font-medium">Paid</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Transaction ID:</span>
                  <p className="font-mono text-xs break-all">{order.sessionId}</p>
                </div>
              </div>
            </div>

            {/* Ordered Products */}
            {order.products?.items?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                  <ShoppingBag className="w-4 h-4" />
                  Ordered Items
                </h3>
                <div className="space-y-2 md:space-y-3">
                  {order.products.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-lg">
                      <img src={item.images?.[0] || "/placeholder-product.png"} alt={item.title} className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover border" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm md:text-base truncate">{item.title}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs md:text-sm text-gray-600 mt-1">
                          <span>Qty: {item.quantity}</span>
                          <span>
                            Price: {order.paymentDetails?.currencySymbol || currencySymbol}
                            {item.sellingPrice}
                          </span>
                          <span className="font-medium">
                            Total: {order.paymentDetails?.currencySymbol || currencySymbol}
                            {(item.quantity * item.sellingPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-6 md:p-8 text-center">
            <Package className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Order Details Not Found</h3>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">We couldn't find the order details, but your payment was successful.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-6 md:mt-8">
          <button onClick={() => (window.location.href = "/track-order")} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl transition-all duration-200 font-medium text-sm md:text-base">
            Track Order
          </button>
          <button onClick={() => (window.location.href = "/")} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl transition-all duration-200 font-medium text-sm md:text-base">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

// Server component wrapper with Suspense
export default function SuccessPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading success page...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
