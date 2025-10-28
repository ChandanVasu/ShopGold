"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { ArrowLeft, Trash2, CreditCard } from "lucide-react";
import CheckoutOrderSummary from "../components/CheckoutOrderSummary";
import AddressDisplay from "@/components/AddressDisplay";

export default function PaymentPage() {
  const router = useRouter();
  const [addressData, setAddressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Check if address exists, if not redirect to address page
    const savedBillingDetails = localStorage.getItem("checkoutBillingDetails");
    if (!savedBillingDetails) {
      router.push("/checkout/address");
      return;
    }
    setLoading(false);
  }, [router]);

  const handleAddressChange = useCallback((newAddressData) => {
    setAddressData(newAddressData);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-green-600 rounded-full mx-auto mb-3"></div>
          <p className="text-gray-600">Loading Order Summary...</p>
        </div>
      </div>
    );
  }

  const handleBack = () => router.push("/checkout/address");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-8 py-6">
        {/* Progress Steps */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-600 text-white font-semibold text-sm">✓</div>
            <span className="ml-3 text-gray-800 font-medium text-base">Cart</span>
          </div>
          <div className="w-12 h-px bg-gray-300" />
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-600 text-white font-semibold text-sm">✓</div>
            <span className="ml-3 text-gray-800 font-medium text-base">Address</span>
          </div>
          <div className="w-12 h-px bg-gray-300" />
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm">3</div>
            <span className="ml-3 text-blue-600 font-medium text-base">Payment</span>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 justify-between items-start max-w-7xl mx-auto">
          {/* Left Column - Address Summary */}
          <div className="w-full xl:w-3/5">
            {/* Delivery Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">Delivery Details</h2>
                <Button 
                  onClick={handleBack} 
                  variant="bordered" 
                  size="sm" 
                  startContent={<ArrowLeft className="w-4 h-4" />} 
                  className="text-sm hover:bg-gray-50"
                >
                  Change Address
                </Button>
              </div>

              {/* Use AddressDisplay component */}
              <AddressDisplay size="normal" onAddressChange={handleAddressChange} />
            </div>
          </div>

          {/* Right Column - Payment */}
          <div className="w-full xl:w-2/5">
            <div className="sticky top-6">
              {addressData ? (
                <CheckoutOrderSummary billingDetails={addressData} setErrors={setErrors} />
              ) : (
                <div className="w-full rounded-2xl p-6 lg:p-8 border border-indigo-100 bg-white shadow-sm h-min">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading order summary...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
