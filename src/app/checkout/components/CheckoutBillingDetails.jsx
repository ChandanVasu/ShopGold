"use client";
import React, { useState, useEffect } from "react";
import { Input, Select, SelectItem } from "@heroui/react";
import { useCurrency } from "@/hooks/useCurrency";

export default function CheckoutBillingDetails({ billingDetails, setBillingDetails, errors }) {
  const { currency } = useCurrency();
  const isIndianCurrency = currency === "INR";
  
  // Safety check for billingDetails
  if (!billingDetails || !billingDetails.customer || !billingDetails.address) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-center text-gray-600">Loading billing details...</p>
      </div>
    );
  }
  
  // State options based on currency
  const stateOptions = {
    INR: [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
      "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
      "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
      "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
      "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
    ],
    USD: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
      "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
      "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
      "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
      "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
      "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
      "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
      "Wisconsin", "Wyoming"
    ]
  };

  const currentStates = stateOptions[currency] || stateOptions.INR;
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const [group, field] = name.split(".");

    // Handle mobile number validation (max 10 digits)
    if (field === 'phone' && value.replace(/\D/g, '').length > 10) {
      return;
    }

    // Handle pincode validation (max 6 digits for INR, 5 for USD)
    if (field === 'zip') {
      const maxLength = isIndianCurrency ? 6 : 5;
      if (value.replace(/\D/g, '').length > maxLength) {
        return;
      }
    }

    setBillingDetails((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value,
      },
    }));
  };

  const handleStateChange = (value) => {
    setBillingDetails((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        state: value,
      },
    }));
  };

  return (
    <div className="w-full md:w-3/5">
      <h2 className="text-sm md:text-xl font-semibold mb-4">Shipping Address</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full Name *"
          name="customer.fullName"
          value={billingDetails.customer.fullName}
          onChange={handleInputChange}
          placeholder="Enter your full name"
          labelPlacement="outside"
          size="sm"
          isRequired
          isInvalid={errors.fullNameError}
          errorMessage={errors.fullNameError ? "Full name is required" : ""}
        />

        <Input
          label="Mobile *"
          name="customer.phone"
          value={billingDetails.customer.phone}
          onChange={handleInputChange}
          placeholder="Enter 10 digit mobile number"
          labelPlacement="outside"
          size="sm"
          type="tel"
          isRequired
          maxLength={10}
          pattern="[0-9]*"
          isInvalid={errors.phoneError}
          errorMessage={errors.phoneError ? "10 digit mobile number is required" : ""}
        />

        <Input
          label="Address 1 *"
          name="address.address1"
          value={billingDetails.address.address1}
          onChange={handleInputChange}
          placeholder="Enter your street address"
          labelPlacement="outside"
          size="sm"
          isRequired
          isInvalid={errors.address1Error}
          errorMessage={errors.address1Error ? "Address is required" : ""}
          className="md:col-span-2"
        />

        <Input
          label="Address 2"
          name="address.address2"
          value={billingDetails.address.address2}
          onChange={handleInputChange}
          placeholder="Enter address line 2 (optional)"
          labelPlacement="outside"
          size="sm"
          className="md:col-span-2"
        />

        <Input
          label="City *"
          name="address.city"
          value={billingDetails.address.city}
          onChange={handleInputChange}
          placeholder="Enter your city"
          labelPlacement="outside"
          size="sm"
          isRequired
          isInvalid={errors.cityError}
          errorMessage={errors.cityError ? "City is required" : ""}
        />

        <Input
          label={`${isIndianCurrency ? 'Pincode' : 'ZIP Code'} *`}
          name="address.zip"
          value={billingDetails.address.zip}
          onChange={handleInputChange}
          placeholder={`Enter ${isIndianCurrency ? '6 digit pincode' : '5 digit ZIP code'}`}
          labelPlacement="outside"
          size="sm"
          type="tel"
          isRequired
          maxLength={isIndianCurrency ? 6 : 5}
          pattern="[0-9]*"
          isInvalid={errors.zipError}
          errorMessage={errors.zipError ? `${isIndianCurrency ? '6 digit pincode' : '5 digit ZIP code'} is required` : ""}
        />

        <Select
          label="State *"
          placeholder="Select your state"
          labelPlacement="outside"
          size="sm"
          isRequired
          selectedKeys={billingDetails.address.state ? [billingDetails.address.state] : []}
          onSelectionChange={(keys) => handleStateChange(Array.from(keys)[0])}
          isInvalid={errors.stateError}
          errorMessage={errors.stateError ? "State is required" : ""}
          className="md:col-span-2"
        >
          {currentStates.map((state) => (
            <SelectItem key={state} value={state}>
              {state}
            </SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
}
