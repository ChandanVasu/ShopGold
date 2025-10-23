"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { ArrowLeft, Trash2, CreditCard } from "lucide-react";
import CheckoutOrderSummary from "../components/CheckoutOrderSummary";

export default function PaymentPage() {
  const router = useRouter();
  const [billingDetails, setBillingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const savedBillingDetails = localStorage.getItem("checkoutBillingDetails");

    if (savedBillingDetails) {
      setBillingDetails(JSON.parse(savedBillingDetails));
    } else {
      router.push("/checkout/address");
    }
    setLoading(false);
  }, [router]);

  if (loading || !billingDetails) {
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-600 text-white font-semibold text-sm">✓</div>
            <span className="ml-3 text-gray-800 font-medium">Cart</span>
          </div>
          <div className="w-12 h-px bg-gray-300" />
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-600 text-white font-semibold text-sm">✓</div>
            <span className="ml-3 text-gray-800 font-medium">Address</span>
          </div>
          <div className="w-12 h-px bg-gray-300" />
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm">3</div>
            <span className="ml-3 text-blue-600 font-medium">Payment</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 justify-center items-start max-w-7xl mx-auto">
          {/* Left Column - Address Summary */}
          <div className="w-full lg:w-2/3">
            {/* Delivery Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-green-600"></div>
                  </div>
                  <h2 className="font-semibold text-gray-800">Delivery Address</h2>
                </div>
                <Button onClick={handleBack} variant="bordered" size="sm" startContent={<ArrowLeft className="w-4 h-4" />} className="text-sm">
                  Change
                </Button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Customer Details</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium text-gray-800">Name:</span> {billingDetails.customer.fullName}
                      </p>
                      <p>
                        <span className="font-medium text-gray-800">Email:</span> {billingDetails.customer.email}
                      </p>
                      {billingDetails.customer.phone && (
                        <p>
                          <span className="font-medium text-gray-800">Phone:</span> {billingDetails.customer.phone}
                        </p>
                      )}
                      {billingDetails.customer.company && (
                        <p>
                          <span className="font-medium text-gray-800">Company:</span> {billingDetails.customer.company}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Shipping Address</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{billingDetails.address.address1}</p>
                      {billingDetails.address.address2 && <p>{billingDetails.address.address2}</p>}
                      <p>
                        {billingDetails.address.city}, {billingDetails.address.state} {billingDetails.address.zip}
                      </p>
                      <p>{billingDetails.address.country}</p>
                    </div>
                  </div>
                </div>

                {billingDetails.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Order Notes</h3>
                    <p className="text-sm text-gray-600 italic">"{billingDetails.notes}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Payment */}
          <div className="w-full max-w-full">
            <CheckoutOrderSummary billingDetails={billingDetails} setErrors={setErrors} />
          </div>
        </div>
      </div>
    </div>
  );
}
