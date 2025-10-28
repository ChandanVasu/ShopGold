"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@heroui/react";
import { MapPin, Edit2, Plus, User, Phone } from "lucide-react";
import Link from "next/link";

export default function AddressDisplay({ size = "normal", onAddressChange = null, showAddButton = true }) {
  const [savedAddress, setSavedAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const onAddressChangeRef = useRef(onAddressChange);

  // Update the ref when the callback changes
  useEffect(() => {
    onAddressChangeRef.current = onAddressChange;
  }, [onAddressChange]);

  const loadSavedAddress = () => {
    try {
      const billingDetails = localStorage.getItem("checkoutBillingDetails");
      if (billingDetails) {
        const parsedDetails = JSON.parse(billingDetails);
        setSavedAddress(parsedDetails);
        if (onAddressChangeRef.current) {
          onAddressChangeRef.current(parsedDetails);
        }
      } else {
        setSavedAddress(null);
        if (onAddressChangeRef.current) {
          onAddressChangeRef.current(null);
        }
      }
    } catch (error) {
      console.error("Error loading saved address:", error);
      setSavedAddress(null);
      if (onAddressChangeRef.current) {
        onAddressChangeRef.current(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedAddress();

    // Listen for address updates in localStorage (different tabs)
    const handleStorageChange = (e) => {
      if (e.key === "checkoutBillingDetails") {
        loadSavedAddress();
      }
    };

    // Listen for custom address update events (same tab)
    const handleAddressUpdate = () => {
      loadSavedAddress();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("addressUpdated", handleAddressUpdate);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("addressUpdated", handleAddressUpdate);
    };
  }, []); // Remove onAddressChange dependency to prevent infinite loop

  if (isLoading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-3 animate-pulse ${size === "small" ? "text-xs" : "text-sm"}`}>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!savedAddress) {
    // If showAddButton is false, don't render anything when no address
    if (!showAddButton) {
      return null;
    }
    
    return (
      <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 text-center ${size === "small" ? "text-xs" : "text-sm"}`}>
        <MapPin className={`${size === "small" ? "w-4 h-4" : "w-5 h-5"} text-gray-400 mx-auto mb-2`} />
        <p className="text-gray-600 mb-2">No address saved</p>
        <Link href="/checkout/address">
          <Button
            size={size === "small" ? "sm" : "md"}
            variant="flat"
            className="bg-gray-900 text-white text-xs"
            startContent={<Plus className={`${size === "small" ? "w-3 h-3" : "w-4 h-4"}`} />}
          >
            Add Address
          </Button>
        </Link>
      </div>
    );
  }

  const { customer, address } = savedAddress;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm ${size === "small" ? "text-xs" : "text-sm"}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className={`${size === "small" ? "w-4 h-4" : "w-5 h-5"} text-gray-600`} />
          <span className={`font-semibold text-gray-900 ${size === "small" ? "text-xs" : "text-sm"}`}>
            Delivery Address
          </span>
        </div>
        <Link href="/checkout/address">
          <Button
            size="sm"
            variant="flat"
            className="text-blue-600 bg-blue-50 h-6 px-2 min-w-0"
            startContent={<Edit2 className="w-3 h-3" />}
          >
            Edit
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {customer?.fullName && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <p className={`font-medium text-gray-900 ${size === "small" ? "text-xs" : "text-sm"}`}>
              {customer.fullName}
            </p>
          </div>
        )}
        
        {customer?.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <p className={`text-gray-600 ${size === "small" ? "text-xs" : "text-sm"}`}>
              +91 {customer.phone}
            </p>
          </div>
        )}

        <div className={`text-gray-700 ${size === "small" ? "text-xs" : "text-sm"}`}>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{address?.address1}</p>
              {address?.address2 && <p>{address.address2}</p>}
              <p>
                {address?.city && `${address.city}, `}
                {address?.state && `${address.state}`}
              </p>
              <p className="font-medium">
                {address?.zip && `PIN: ${address.zip}`}
              </p>
            </div>
          </div>
        </div>

        {savedAddress?.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className={`text-gray-600 italic ${size === "small" ? "text-xs" : "text-sm"}`}>
              <span className="font-medium text-gray-700">Note:</span> {savedAddress.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}