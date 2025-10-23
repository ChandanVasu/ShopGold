"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea } from "@heroui/react";
import { ArrowRight, MapPin, User, Mail, Phone, Building } from "lucide-react";

export default function AddressPage() {
  const router = useRouter();
  const [billingDetails, setBillingDetails] = useState({
    customer: { fullName: "", company: "", phone: "", email: "" },
    address: { country: "", address1: "", address2: "", city: "", state: "", zip: "" },
    notes: "",
  });
  const [errors, setErrors] = useState({});

  // Load saved address data from localStorage on mount
  useEffect(() => {
    const savedBillingDetails = localStorage.getItem("checkoutBillingDetails");
    if (savedBillingDetails) {
      setBillingDetails(JSON.parse(savedBillingDetails));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "notes") {
      setBillingDetails((prev) => ({
        ...prev,
        notes: value,
      }));
    } else {
      const [group, field] = name.split(".");
      setBillingDetails((prev) => ({
        ...prev,
        [group]: {
          ...prev[group],
          [field]: value,
        },
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Customer validation
    if (!billingDetails.customer.fullName.trim()) {
      newErrors.fullNameError = true;
    }
    if (!billingDetails.customer.email.trim()) {
      newErrors.emailError = true;
    }

    // Address validation
    if (!billingDetails.address.country.trim()) {
      newErrors.countryError = true;
    }
    if (!billingDetails.address.address1.trim()) {
      newErrors.address1Error = true;
    }
    if (!billingDetails.address.city.trim()) {
      newErrors.cityError = true;
    }
    if (!billingDetails.address.state.trim()) {
      newErrors.stateError = true;
    }
    if (!billingDetails.address.zip.trim()) {
      newErrors.zipError = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      // Save billing details to localStorage
      localStorage.setItem("checkoutBillingDetails", JSON.stringify(billingDetails));
      // Navigate to payment page
      router.push("/checkout/payment");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-600 text-white font-semibold text-sm">✓</div>
            <span className="ml-3 text-gray-800 font-medium">Cart</span>
          </div>
          <div className="w-12 h-px bg-gray-300" />
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm">2</div>
            <span className="ml-3 text-blue-600 font-medium">Address</span>
          </div>
          <div className="w-12 h-px bg-gray-300" />
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-300 text-gray-400 font-semibold text-sm">3</div>
            <span className="ml-3 text-gray-400 font-medium">Payment</span>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shipping Address</h1>
              <p className="text-sm text-gray-600">Please provide your billing and shipping information</p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full name"
                name="customer.fullName"
                value={billingDetails.customer.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                labelPlacement="outside"
                size="lg"
                startContent={<User className="w-4 h-4 text-gray-400" />}
                isInvalid={errors.fullNameError}
                errorMessage={errors.fullNameError ? "Full name is required" : ""}
                isRequired
              />

              <Input
                label="Email address"
                name="customer.email"
                type="email"
                value={billingDetails.customer.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                labelPlacement="outside"
                size="lg"
                startContent={<Mail className="w-4 h-4 text-gray-400" />}
                isInvalid={errors.emailError}
                errorMessage={errors.emailError ? "Valid email address is required" : ""}
                isRequired
              />

              <Input
                label="Phone number"
                name="customer.phone"
                value={billingDetails.customer.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                labelPlacement="outside"
                size="lg"
                startContent={<Phone className="w-4 h-4 text-gray-400" />}
              />

              <Input
                label="Company name"
                name="customer.company"
                value={billingDetails.customer.company}
                onChange={handleInputChange}
                placeholder="Enter your company name (optional)"
                labelPlacement="outside"
                size="lg"
                startContent={<Building className="w-4 h-4 text-gray-400" />}
              />
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Street address"
                  name="address.address1"
                  value={billingDetails.address.address1}
                  onChange={handleInputChange}
                  placeholder="Enter your street address"
                  labelPlacement="outside"
                  size="lg"
                  isInvalid={errors.address1Error}
                  errorMessage={errors.address1Error ? "Street address is required" : ""}
                  isRequired
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Address line 2"
                  name="address.address2"
                  value={billingDetails.address.address2}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, unit, building, floor, etc. (optional)"
                  labelPlacement="outside"
                  size="lg"
                />
              </div>

              <Input
                label="City"
                name="address.city"
                value={billingDetails.address.city}
                onChange={handleInputChange}
                placeholder="Enter your city"
                labelPlacement="outside"
                size="lg"
                isInvalid={errors.cityError}
                errorMessage={errors.cityError ? "City is required" : ""}
                isRequired
              />

              <Input
                label="State / Province"
                name="address.state"
                value={billingDetails.address.state}
                onChange={handleInputChange}
                placeholder="Enter your state"
                labelPlacement="outside"
                size="lg"
                isInvalid={errors.stateError}
                errorMessage={errors.stateError ? "State is required" : ""}
                isRequired
              />

              <Input
                label="ZIP / Postal Code"
                name="address.zip"
                value={billingDetails.address.zip}
                onChange={handleInputChange}
                placeholder="Enter your ZIP code"
                labelPlacement="outside"
                size="lg"
                isInvalid={errors.zipError}
                errorMessage={errors.zipError ? "ZIP code is required" : ""}
                isRequired
              />

              <Input
                label="Country"
                name="address.country"
                value={billingDetails.address.country}
                onChange={handleInputChange}
                placeholder="Enter your country"
                labelPlacement="outside"
                size="lg"
                isInvalid={errors.countryError}
                errorMessage={errors.countryError ? "Country is required" : ""}
                isRequired
              />
            </div>
          </div>

          {/* Order Notes */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Order Notes</h2>
            <Textarea
              label="Special instructions"
              name="notes"
              value={billingDetails.notes}
              onChange={handleInputChange}
              placeholder="Any special delivery instructions or notes about your order (optional)"
              labelPlacement="outside"
              size="lg"
              minRows={3}
            />
          </div>

          {/* Continue Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleContinue}
              color="primary"
              size="lg"
              endContent={<ArrowRight className="w-4 h-4" />}
              className="px-8 bg-[#5A3E1B] hover:bg-[#4A3217]"
            >
              Continue to Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
