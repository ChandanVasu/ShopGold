"use client";
import { useState, useEffect } from "react";
import ProductData from "./Product";
import StripeCardForm from "../paymentMethod/StripeCardForm";
import PayPalButton from "../paymentMethod/PayPalButton";
import orderCreate from "./orderCreate";
import { usePaymentSettings } from "../PaymentContext";
import { Tabs, Tab } from "@heroui/react";

export default function CheckoutOrderSummary({ billingDetails, setErrors }) {
  const { items: products, loading } = ProductData();
  const [storeSettings, setStoreSettings] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("stripe");
  const paymentSettings = usePaymentSettings();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/setting?type=store", {
          cache: "force-cache",
          next: { revalidate: 300 }
        });
        const data = await res.json();
        setStoreSettings(data);
      } catch (err) {
        console.error("Failed to fetch store settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // Set default payment method based on what's enabled
  useEffect(() => {
    if (paymentSettings) {
      if (paymentSettings.stripe?.enabled) {
        setSelectedPayment("stripe");
      } else if (paymentSettings.paypal?.enabled) {
        setSelectedPayment("paypal");
      }
    }
  }, [paymentSettings]);

  const currencySymbol = storeSettings?.currencySymbol || "$";
  const storeCurrency = storeSettings?.storeCurrency || "USD";

  const costDetails = {
    subtotal: products.reduce((acc, p) => acc + Number(p.salePrice || p.regularPrice) * p.quantity, 0),
    shipping: 0,
    tax: 0,
    get total() {
      return this.subtotal + this.shipping + this.tax;
    },
  };

  return (
    <div className="w-full md:w-2/5 rounded-2xl p-6 border border-indigo-100 h-min">
      <h3 className="text-xl font-semibold mb-6 text-indigo-900">Your Order</h3>

      {/* Product Summary */}
      <div className="border-b pb-4 text-sm text-gray-700 space-y-4">
        <div className="flex justify-between font-medium text-gray-900">
          <span>Product</span>
          <span>Subtotal</span>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500 text-sm">No products in cart.</p>
        ) : (
          products.map((item) => (
            <div key={item._id} className="flex justify-between items-start gap-4">
              <div className="flex gap-3 items-start">
                <img src={item.image} alt={item.title} className="w-16 rounded-md" />
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  {item.color && <p className="text-xs text-gray-500">Color: {item.color}</p>}
                  {item.size && <p className="text-xs text-gray-500">Size: {item.size}</p>}
                </div>
              </div>
              <div className="text-right font-medium text-gray-900">
                {currencySymbol}
                {(item.salePrice || item.regularPrice) * item.quantity}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cost Summary */}
      <div className="py-4 border-b text-sm text-gray-700 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>
            {currencySymbol}
            {costDetails.subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>
            {currencySymbol}
            {costDetails.shipping.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 text-base">
          <span>Total</span>
          <span>
            {currencySymbol}
            {costDetails.total.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <h1 className="text-sm font-semibold">Payment Method</h1>

        {/* Payment Method Tabs */}
        {paymentSettings && (
          <Tabs 
            selectedKey={selectedPayment} 
            onSelectionChange={setSelectedPayment}
            variant="bordered"
            color="primary"
          >
            {paymentSettings.stripe?.enabled && (
              <Tab key="stripe" title="Credit Card">
                <div className="mt-4">
                  <StripeCardForm
                    billingDetails={billingDetails}
                    setErrors={setErrors}
                    amount={costDetails.total}
                    currency={storeCurrency}
                    currencySymbol={currencySymbol}
                    onSuccess={async (paymentIntent) => {
                      const orderId = await orderCreate({
                        products,
                        billingDetails,
                        paymentDetails: {
                          paymentMethod: "stripe",
                          total: costDetails.total,
                          currencySymbol: currencySymbol,
                          status: "paid",
                          paymentIntentId: paymentIntent?.id,
                          paymentStatus: paymentIntent?.status,
                        },
                      });

                      if (orderId) {
                        window.location.href = `/checkout/success`;
                      } else {
                        setErrors("Failed to create order after payment.");
                        window.location.href = "/checkout/failure";
                      }
                    }}
                    onError={(msg) => {
                      setErrors(msg);
                    }}
                  />
                </div>
              </Tab>
            )}

            {paymentSettings.paypal?.enabled && (
              <Tab key="paypal" title="PayPal">
                <div className="mt-4">
                  <PayPalButton
                    amount={costDetails.total}
                    currency={storeCurrency}
                    onSuccess={async (details) => {
                      const orderId = await orderCreate({
                        products,
                        billingDetails,
                        paymentDetails: {
                          paymentMethod: "paypal",
                          total: costDetails.total,
                          currencySymbol: currencySymbol,
                          status: "paid",
                          paymentIntentId: details.id,
                          paymentStatus: details.status,
                        },
                      });

                      if (orderId) {
                        window.location.href = `/checkout/success`;
                      } else {
                        setErrors("Failed to create order after payment.");
                        window.location.href = "/checkout/failure";
                      }
                    }}
                    onError={(msg) => {
                      setErrors(msg);
                    }}
                  />
                </div>
              </Tab>
            )}
          </Tabs>
        )}

        {/* No payment gateway configured message */}
        {!paymentSettings || (!paymentSettings.stripe?.enabled && !paymentSettings.paypal?.enabled) && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-sm">No payment methods available</p>
            <p className="text-gray-500 text-xs mt-1">Please configure payment gateway in admin panel</p>
          </div>
        )}
      </div>
    </div>
  );
}
