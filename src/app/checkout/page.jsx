"use client";
import React, { useState } from "react";
import CheckoutBillingDetails from "./components/CheckoutBillingDetails";
import CheckoutOrderSummary from "./components/CheckoutOrderSummary";

export default function CheckoutPage() {
  const [billingDetails, setBillingDetails] = useState({
    customer: { fullName: "", company: "", phone: "", email: "" },
    address: { country: "", address1: "", address2: "", city: "", state: "", zip: "" },
    notes: "",
  });

  const [errors, setErrors] = useState({});


  return (
    <div className="container mx-auto px-4 md:px-20 my-14">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <p className="text-sm text-gray-600 mb-4">Please fill your details to place the order.</p>

      <div className="flex flex-col md:flex-row gap-8">
        <CheckoutBillingDetails billingDetails={billingDetails} setBillingDetails={setBillingDetails} errors={errors} />

        <CheckoutOrderSummary billingDetails={billingDetails} setErrors={setErrors} />
      </div>
    </div>
  );
}
