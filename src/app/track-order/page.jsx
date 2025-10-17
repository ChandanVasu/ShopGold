"use client";

import { useState } from "react";
import { Input, Button } from "@heroui/react";
import { Package, Search, CheckCircle, Truck, Clock, Home } from "lucide-react";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e) => {
    e.preventDefault();
    setError("");
    setOrder(null);

    if (!orderId && !email) {
      setError("Please enter either Order ID or Email");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (orderId) params.append("orderId", orderId);
      if (email) params.append("email", email);

      const res = await fetch(`/api/order?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data) {
        setOrder(data);
      } else {
        setError("Order not found. Please check your Order ID or Email.");
      }
    } catch (err) {
      setError("Failed to track order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status) => {
    const statuses = ["pending", "processing", "shipped", "out-for-delivery", "delivered"];
    return statuses.indexOf(status?.toLowerCase()) + 1;
  };

  const statusSteps = [
    { label: "Order Placed", icon: CheckCircle, status: "pending" },
    { label: "Processing", icon: Clock, status: "processing" },
    { label: "Shipped", icon: Package, status: "shipped" },
    { label: "Out for Delivery", icon: Truck, status: "out-for-delivery" },
    { label: "Delivered", icon: Home, status: "delivered" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Package className="w-16 h-16 mx-auto text-gray-800 mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Track Your Order
          </h1>
          <p className="text-gray-600">
            Enter your order ID or email to track your order status
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrack} className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input
              label="Order ID"
              placeholder="e.g., ORD123456"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              labelPlacement="outside"
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              labelPlacement="outside"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            isLoading={loading}
            className="w-full bg-gray-900 text-white font-medium"
            startContent={!loading && <Search className="w-4 h-4" />}
          >
            {loading ? "Tracking..." : "Track Order"}
          </Button>

          {error && (
            <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
          )}
        </form>

        {/* Order Status */}
        {order && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            {/* Order Info */}
            <div className="mb-8 pb-6 border-b">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Order #{order.orderId || order._id}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${order.total || order.amount}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Order Status
              </h3>
              <div className="relative">
                {statusSteps.map((step, index) => {
                  const currentStatusIndex = getStatusIndex(order.status);
                  const isCompleted = index < currentStatusIndex;
                  const isCurrent = index === currentStatusIndex - 1;
                  const Icon = step.icon;

                  return (
                    <div key={index} className="flex items-center mb-8 last:mb-0">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted || isCurrent
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Label */}
                      <div className="ml-4 flex-1">
                        <p
                          className={`font-semibold ${
                            isCompleted || isCurrent
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-sm text-green-600 mt-1">
                            Current Status
                          </p>
                        )}
                      </div>

                      {/* Connector Line */}
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`absolute left-6 w-0.5 h-8 ${
                            isCompleted ? "bg-green-500" : "bg-gray-200"
                          }`}
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

            {/* Shipping Info */}
            {order.shippingAddress && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Shipping Address
                </h3>
                <p className="text-sm text-gray-600">
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                  {order.shippingAddress.country}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
