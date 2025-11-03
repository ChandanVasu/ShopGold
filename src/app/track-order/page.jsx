"use client";

import { useState } from "react";
import { Input, Button } from "@heroui/react";
import { Package, Search, CheckCircle, Truck, Clock, Home } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { symbol: currencySymbol, currency } = useCurrency();

  const handleTrack = async (e) => {
    e.preventDefault();
    setError("");
    setOrder(null);

    if (!orderId && !phone) {
      setError("Please enter either Order ID or Phone Number");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (orderId) params.append("orderId", orderId);
      if (phone) params.append("phone", phone);

      const res = await fetch(`/api/order?${params.toString()}`);
      const data = await res.json();

      if (res.ok && Array.isArray(data) && data.length > 0) {
        // Filter orders to find the best match
        let foundOrder = null;

        if (orderId) {
          // First try to match by sessionId, then by _id
          foundOrder = data.find((order) => order.sessionId === orderId || order._id === orderId);
        }

        if (!foundOrder && phone) {
          // Find order by phone number
          foundOrder = data.find((order) => order.phone === phone || order.shipping?.phone === phone);
        }

        // If no specific match, take the most recent order
        if (!foundOrder) {
          foundOrder = data[0];
        }

        setOrder(foundOrder);
      } else {
        setError("Order not found. Please check your Order ID or Phone Number.");
      }
    } catch (err) {
      console.error("Track order error:", err);
      setError("Failed to track order. Please try again.");
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
      // 4 days (48 + 48)
      return {
        status: "in-transit",
        message: "Your order is in transit",
        statusIndex: 2,
      };
    } else if (hoursElapsed < 120) {
      // 5 days (96 + 24)
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
    { label: "Order Placed", icon: CheckCircle, status: "pending", message: "Order will be dispatch soon" },
    { label: "Dispatched", icon: Package, status: "dispatched", message: "Order has been dispatched from warehouse" },
    { label: "In Transit", icon: Truck, status: "in-transit", message: "Order is on the way to your location" },
    { label: "Out for Delivery", icon: Clock, status: "out-for-delivery", message: "Order is out for delivery" },
    { label: "Delivered", icon: Home, status: "delivered", message: "Order has been delivered successfully" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Package className="w-16 h-16 mx-auto text-gray-800 mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-gray-600">Enter your order ID or phone number to track your order status</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrack} className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input label="Order ID" placeholder="e.g., ORD123456" value={orderId} onChange={(e) => setOrderId(e.target.value)} labelPlacement="outside" />
            <Input label="Phone Number" type="tel" placeholder="e.g., +1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} labelPlacement="outside" />
          </div>

          <Button type="submit" size="lg" isLoading={loading} className="w-full bg-gray-900 text-white font-medium" startContent={!loading && <Search className="w-4 h-4" />}>
            {loading ? "Tracking..." : "Track Order"}
          </Button>

          {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}
        </form>

        {/* Order Status */}
        {order && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            {/* Order Info */}
            <div className="mb-8 pb-6 border-b">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Order #{order.sessionId || order._id}</h2>
                  <p className="text-sm text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {order.paymentDetails?.currencySymbol || currencySymbol}
                    {order.paymentDetails?.total || order.amount}
                  </p>
                </div>
              </div>

              {/* Current Status Message */}
              {(() => {
                const currentStatus = getOrderStatus(order.createdAt);
                return (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-800 font-medium text-center">{currentStatus.message}</p>
                  </div>
                );
              })()}
            </div>

            {/* Status Timeline */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h3>
              <div className="relative">
                {statusSteps.map((step, index) => {
                  const currentStatus = getOrderStatus(order.createdAt);
                  const isCompleted = index < currentStatus.statusIndex;
                  const isCurrent = index === currentStatus.statusIndex;
                  const Icon = step.icon;

                  return (
                    <div key={index} className="flex items-center mb-8 last:mb-0">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted || isCurrent ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Label */}
                      <div className="ml-4 flex-1">
                        <p className={`font-semibold ${isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                        {isCurrent && <p className="text-sm text-green-600 mt-1">Current Status</p>}
                        {(isCompleted || isCurrent) && <p className="text-xs text-gray-500 mt-1">{step.message}</p>}
                      </div>

                      {/* Connector Line */}
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`absolute left-6 w-0.5 h-8 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`}
                          style={{
                            top: `${(index + 1) * 80}px`,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer Info */}
            {order.name && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Name:</span> {order.name}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span> {order.phone}
                  </p>
                </div>
              </div>
            )}

            {/* Shipping Info */}
            {order.shipping?.address && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                <p className="text-sm text-gray-600">
                  {order.shipping.address.address1}
                  {order.shipping.address.address2 && (
                    <>
                      <br />
                      {order.shipping.address.address2}
                    </>
                  )}
                  <br />
                  {order.shipping.address.city}, {order.shipping.address.state} {order.shipping.address.zip}
                  <br />
                  {order.shipping.address.country}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
