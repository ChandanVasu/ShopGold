"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-md text-center space-y-6">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 animate-pulse" />
        <h1 className="text-2xl font-bold text-gray-800">Payment Successful</h1>
        <p className="text-gray-600">Thank you for your purchase! Your order has been confirmed.</p>

        <div className="bg-gray-100 rounded-xl p-4 text-left text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Status:</span>
            <span className="text-green-600 font-medium">Completed</span>
          </div>
        </div>

        <button
          onClick={() => (window.location.href = "/")}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl transition-all duration-200"
        >
          Back to Home
        </button>
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
