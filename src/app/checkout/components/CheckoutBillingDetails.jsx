"use client";
import React from "react";
import { Input } from "@heroui/react";

export default function CheckoutBillingDetails({ billingDetails, setBillingDetails, errors }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const [group, field] = name.split(".");

    setBillingDetails((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value,
      },
    }));
  };

  return (
    <div className="w-full md:w-3/5">
      <h2 className="text-xl font-semibold mb-4">Billing Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full name"
          name="customer.fullName"
          value={billingDetails.customer.fullName}
          onChange={handleInputChange}
          placeholder="Enter your full name"
          labelPlacement="outside"
          size="sm"
          isInvalid={errors.fullNameError}
          errorMessage={errors.fullNameError ? "Full name is required" : ""}
        />

        <Input
          label="Email address"
          name="customer.email"
          value={billingDetails.customer.email}
          onChange={handleInputChange}
          placeholder="Enter your email address"
          labelPlacement="outside"
          size="sm"
          isInvalid={errors.emailError}
          errorMessage={errors.emailError ? "Email address is required" : ""}
        />

        <Input
          label="Company name"
          name="customer.company"
          value={billingDetails.customer.company}
          onChange={handleInputChange}
          placeholder="Enter your company name"
          labelPlacement="outside"
          size="sm"
        />

        <Input
          label="Phone"
          name="customer.phone"
          value={billingDetails.customer.phone}
          onChange={handleInputChange}
          placeholder="Enter your phone number"
          labelPlacement="outside"
          size="sm"
        />

        <Input
          label="Country"
          name="address.country"
          value={billingDetails.address.country}
          onChange={handleInputChange}
          placeholder="Enter your country"
          labelPlacement="outside"
          size="sm"
          isInvalid={errors.countryError}
          errorMessage={errors.countryError ? "Country is required" : ""}
        />

        <Input
          label="Street address"
          name="address.address1"
          value={billingDetails.address.address1}
          onChange={handleInputChange}
          placeholder="Enter your street address"
          labelPlacement="outside"
          size="sm"
          isInvalid={errors.address1Error}
          errorMessage={errors.address1Error ? "Address is required" : ""}
        />

        <Input
          label="Address line 2"
          name="address.address2"
          value={billingDetails.address.address2}
          onChange={handleInputChange}
          placeholder="Enter address line 2 (optional)"
          labelPlacement="outside"
          size="sm"
        />

        <Input
          label="City"
          name="address.city"
          value={billingDetails.address.city}
          onChange={handleInputChange}
          placeholder="Enter your city"
          labelPlacement="outside"
          size="sm"
        />

        <Input
          label="State"
          name="address.state"
          value={billingDetails.address.state}
          onChange={handleInputChange}
          placeholder="Enter your state"
          labelPlacement="outside"
          size="sm"
        />

        <Input
          label="ZIP Code"
          name="address.zip"
          value={billingDetails.address.zip}
          onChange={handleInputChange}
          placeholder="Enter your ZIP code"
          labelPlacement="outside"
          size="sm"
          isInvalid={errors.zipError}
          errorMessage={errors.zipError ? "ZIP code is required" : ""}
        />
      </div>
    </div>
  );
}
