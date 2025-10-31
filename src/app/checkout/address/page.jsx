"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { ArrowRight, MapPin, User, Phone, RotateCcw, Save } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export default function AddressPage() {
  const router = useRouter();
  const { currency } = useCurrency();
  const isIndianCurrency = currency === "INR";

  // State options based on currency
  const stateOptions = {
    INR: [
      // States and Union Territories in alphabetical order
      "Andaman and Nicobar Islands",
      "Andhra Pradesh",
      "Arunachal Pradesh",
      "Assam",
      "Bihar",
      "Chandigarh",
      "Chhattisgarh",
      "Dadra and Nagar Haveli and Daman and Diu",
      "Delhi",
      "Goa",
      "Gujarat",
      "Haryana",
      "Himachal Pradesh",
      "Jammu and Kashmir",
      "Jharkhand",
      "Karnataka",
      "Kerala",
      "Ladakh",
      "Lakshadweep",
      "Madhya Pradesh",
      "Maharashtra",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Odisha",
      "Puducherry",
      "Punjab",
      "Rajasthan",
      "Sikkim",
      "Tamil Nadu",
      "Telangana",
      "Tripura",
      "Uttar Pradesh",
      "Uttarakhand",
      "West Bengal",
    ],
    USD: [
      "Alabama",
      "Alaska",
      "Arizona",
      "Arkansas",
      "California",
      "Colorado",
      "Connecticut",
      "Delaware",
      "Florida",
      "Georgia",
      "Hawaii",
      "Idaho",
      "Illinois",
      "Indiana",
      "Iowa",
      "Kansas",
      "Kentucky",
      "Louisiana",
      "Maine",
      "Maryland",
      "Massachusetts",
      "Michigan",
      "Minnesota",
      "Mississippi",
      "Missouri",
      "Montana",
      "Nebraska",
      "Nevada",
      "New Hampshire",
      "New Jersey",
      "New Mexico",
      "New York",
      "North Carolina",
      "North Dakota",
      "Ohio",
      "Oklahoma",
      "Oregon",
      "Pennsylvania",
      "Rhode Island",
      "South Carolina",
      "South Dakota",
      "Tennessee",
      "Texas",
      "Utah",
      "Vermont",
      "Virginia",
      "Washington",
      "West Virginia",
      "Wisconsin",
      "Wyoming",
    ],
  };

  const currentStates = stateOptions[currency] || stateOptions.INR;

  const [billingDetails, setBillingDetails] = useState({
    customer: { fullName: "", phone: "" },
    address: { address1: "", address2: "", city: "", state: "", zip: "" },
  });
  const [errors, setErrors] = useState({});
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [saveNotification, setSaveNotification] = useState(false);

  // Load saved address data from localStorage on mount
  useEffect(() => {
    const savedBillingDetails = localStorage.getItem("checkoutBillingDetails");
    if (savedBillingDetails) {
      const parsedDetails = JSON.parse(savedBillingDetails);
      setBillingDetails(parsedDetails);
      setIsAutoFilled(true);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const [group, field] = name.split(".");

    // Handle mobile number validation (max 10 digits)
    if (field === "phone" && value.replace(/\D/g, "").length > 10) {
      return;
    }

    // Handle pincode validation (max 6 digits for INR, 5 for USD)
    if (field === "zip") {
      const maxLength = isIndianCurrency ? 6 : 5;
      if (value.replace(/\D/g, "").length > maxLength) {
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

    // Auto-save to localStorage on every change
    setTimeout(() => {
      const updatedDetails = { ...billingDetails };
      const [group, field] = name.split(".");
      updatedDetails[group] = {
        ...updatedDetails[group],
        [field]: value,
      };
      localStorage.setItem("checkoutBillingDetails", JSON.stringify(updatedDetails));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent("addressUpdated"));

      // Show save notification
      setSaveNotification(true);
      setTimeout(() => setSaveNotification(false), 2000);
    }, 500);
  };

  const handleStateChange = (value) => {
    setBillingDetails((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        state: value,
      },
    }));

    // Auto-save state selection
    setTimeout(() => {
      const updatedDetails = {
        ...billingDetails,
        address: {
          ...billingDetails.address,
          state: value,
        },
      };
      localStorage.setItem("checkoutBillingDetails", JSON.stringify(updatedDetails));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent("addressUpdated"));

      setSaveNotification(true);
      setTimeout(() => setSaveNotification(false), 2000);
    }, 100);
  };

  const validateForm = () => {
    const newErrors = {};

    // Customer validation
    if (!billingDetails.customer.fullName.trim()) {
      newErrors.fullNameError = true;
    }
    if (!billingDetails.customer.phone.trim() || billingDetails.customer.phone.replace(/\D/g, "").length !== 10) {
      newErrors.phoneError = true;
    }

    // Address validation
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
      const requiredLength = isIndianCurrency ? 6 : 5;
      if (billingDetails.address.zip.replace(/\D/g, "").length !== requiredLength) {
        newErrors.zipError = true;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (validateForm()) {
      // Save billing details to localStorage
      localStorage.setItem("checkoutBillingDetails", JSON.stringify(billingDetails));

      // Create pending order with address details
      await createPendingOrder();

      // Navigate to payment page
      router.push("/checkout/payment");
    }
  };

  const createPendingOrder = async () => {
    try {
      // Get cart items
      const cartItems = JSON.parse(localStorage.getItem("buyNow") || "[]");

      if (cartItems.length === 0) {
        console.log("No items in cart, skipping pending order creation");
        return;
      }

      // Create pending order
      const orderPayload = {
        name: billingDetails.customer.fullName,
        email: billingDetails.customer.email || ``,
        phone: billingDetails.customer.phone,
        shipping: {
          address: billingDetails.address,
          name: billingDetails.customer.fullName,
          phone: billingDetails.customer.phone,
        },
        products: {
          items: cartItems.map((item) => ({
            productId: item.productId,
            title: item.title,
            quantity: item.quantity,
            price: item.price,
            sellingPrice: item.price,
            images: item.image ? [item.image] : [],
            variants: [],
          })),
        },
        paymentDetails: {
          paymentMethod: "pending",
          total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
          status: "pending",
          paymentStatus: "pending",
        },
        status: "pending",
        sessionId: Date.now().toString(), // Unique session ID to prevent duplicates
      };

      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      if (response.ok) {
        const order = await response.json();
        // Store order ID for payment page
        localStorage.setItem("pendingOrderId", order._id);
        console.log("Pending order created:", order._id);
      }
    } catch (error) {
      console.error("Error creating pending order:", error);
    }
  };

  const clearForm = () => {
    const emptyDetails = {
      customer: { fullName: "", phone: "" },
      address: { address1: "", address2: "", city: "", state: "", zip: "" },
    };
    setBillingDetails(emptyDetails);
    setIsAutoFilled(false);
    localStorage.removeItem("checkoutBillingDetails");

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("addressUpdated"));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-600 text-white font-semibold text-xs md:text-sm">✓</div>
            <span className="ml-3 text-gray-800 font-medium text-xs md:text-base">Cart</span>
          </div>
          <div className="w-12 h-px bg-gray-300" />
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-xs md:text-sm">2</div>
            <span className="ml-3 text-blue-600 font-medium text-xs md:text-base">Address</span>
          </div>
          <div className="w-12 h-px bg-gray-300" />
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-300 text-gray-400 font-semibold text-xs md:text-sm">3</div>
            <span className="ml-3 text-gray-400 font-medium text-xs md:text-base">Payment</span>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl p-2 md:p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-sm md:text-lg font-semibold text-gray-900">Customer Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
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
                label="Mobile *"
                name="customer.phone"
                value={billingDetails.customer.phone}
                onChange={handleInputChange}
                placeholder="Enter 10 digit mobile number"
                labelPlacement="outside"
                size="lg"
                type="tel"
                maxLength={10}
                pattern="[0-9]*"
                startContent={<Phone className="w-4 h-4 text-gray-400" />}
                isInvalid={errors.phoneError}
                errorMessage={errors.phoneError ? "10 digit mobile number is required" : ""}
                isRequired
              />
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h2 className="text-sm md:text-lg font-semibold text-gray-900">Shipping Address</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Address 1 *"
                  name="address.address1"
                  value={billingDetails.address.address1}
                  onChange={handleInputChange}
                  placeholder="Enter your street address"
                  labelPlacement="outside"
                  size="lg"
                  isInvalid={errors.address1Error}
                  errorMessage={errors.address1Error ? "Address is required" : ""}
                  isRequired
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Address 2"
                  name="address.address2"
                  value={billingDetails.address.address2}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, unit, building, floor, etc. (optional)"
                  labelPlacement="outside"
                  size="lg"
                />
              </div>

              <Input
                label="City *"
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
                label={`${isIndianCurrency ? "Pincode" : "ZIP Code"} *`}
                name="address.zip"
                value={billingDetails.address.zip}
                onChange={handleInputChange}
                placeholder={`Enter ${isIndianCurrency ? "6 digit pincode" : "5 digit ZIP code"}`}
                labelPlacement="outside"
                size="lg"
                type="tel"
                maxLength={isIndianCurrency ? 6 : 5}
                pattern="[0-9]*"
                isInvalid={errors.zipError}
                errorMessage={errors.zipError ? `${isIndianCurrency ? "6 digit pincode" : "5 digit ZIP code"} is required` : ""}
                isRequired
              />

              <div className="md:col-span-2">
                <Select
                  label="State *"
                  placeholder="Select your state"
                  labelPlacement="outside"
                  size="lg"
                  isRequired
                  selectedKeys={billingDetails.address.state ? [billingDetails.address.state] : []}
                  onSelectionChange={(keys) => handleStateChange(Array.from(keys)[0])}
                  isInvalid={errors.stateError}
                  errorMessage={errors.stateError ? "State is required" : ""}
                >
                  {currentStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-end">
            <Button onClick={handleContinue} color="primary" size="lg" endContent={<ArrowRight className="w-4 h-4" />} className="px-8 bg-[#5A3E1B] hover:bg-[#4A3217]">
              Continue to Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
