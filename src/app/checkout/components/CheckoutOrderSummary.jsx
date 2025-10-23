"use client";
import { useState, useEffect } from "react";
import ProductData from "./Product";
import StripeCardForm from "../paymentMethod/StripeCardForm";
import PayPalButton from "../paymentMethod/PayPalButton";
import RazorpayButton from "../paymentMethod/RazorpayButton";
import CashfreeButton from "../paymentMethod/CashfreeButton";
import PayUButton from "../paymentMethod/PayUButton";
import PhonePeButton from "../paymentMethod/PhonePeButton";
import PaytmButton from "../paymentMethod/PaytmButton";
import orderCreate from "./orderCreate";
import { usePaymentSettings } from "../PaymentContext";
import { Tabs, Tab } from "@heroui/react";
import { getAvailablePaymentGateways, gatewayInfo } from "@/utils/paymentValidation";

export default function CheckoutOrderSummary({ billingDetails, setErrors }) {
  const { items: products, loading } = ProductData();
  const [storeSettings, setStoreSettings] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [availableGateways, setAvailableGateways] = useState([]);
  const paymentSettings = usePaymentSettings();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/setting?type=store", {});
        const data = await res.json();
        setStoreSettings(data);
      } catch (err) {
        console.error("Failed to fetch store settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // Update available gateways when payment settings change
  useEffect(() => {
    if (paymentSettings) {
      const available = getAvailablePaymentGateways(paymentSettings);
      setAvailableGateways(available);

      // Set default payment method to first available gateway
      if (available.length > 0 && !selectedPayment) {
        setSelectedPayment(available[0]);
      }
    }
  }, [paymentSettings, selectedPayment]);

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

  // Common order data for all payment gateways
  const orderDataForPayment = {
    name: `${billingDetails.customer.fullName}`,
    email: billingDetails.customer.email,
    phone: billingDetails.customer.phone,
    address: `${billingDetails.address.address1}, ${billingDetails.address.city}, ${billingDetails.address.state} ${billingDetails.address.zip}`,
    company: billingDetails.customer.company,
    country: billingDetails.address.country,
    notes: billingDetails.notes,
  };

  // Common success handler for payment gateways
  const handlePaymentSuccess = async (paymentDetails, paymentMethod) => {
    const orderId = await orderCreate({
      products,
      billingDetails,
      paymentDetails: {
        paymentMethod: paymentMethod,
        total: costDetails.total,
        currencySymbol: currencySymbol,
        status: "paid",
        ...paymentDetails,
      },
    });

    if (orderId) {
      window.location.href = `/checkout/success`;
    } else {
      setErrors("Failed to create order after payment.");
      window.location.href = "/checkout/failure";
    }
  };

  // Common error handler
  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    setErrors(error);
  };

  // Count enabled and properly configured payment methods
  const enabledMethods = availableGateways.length;

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
        {availableGateways.length > 0 && (
          <Tabs selectedKey={selectedPayment} onSelectionChange={setSelectedPayment} variant="bordered" color="primary" className="w-full">
            {/* Stripe */}
            {availableGateways.includes("stripe") && (
              <Tab key="stripe" title={gatewayInfo.stripe.name}>
                <div className="mt-4">
                  <StripeCardForm
                    billingDetails={billingDetails}
                    setErrors={setErrors}
                    amount={costDetails.total}
                    currency={storeCurrency}
                    currencySymbol={currencySymbol}
                    onSuccess={async (paymentIntent) => {
                      await handlePaymentSuccess(
                        {
                          paymentIntentId: paymentIntent?.id,
                          paymentStatus: paymentIntent?.status,
                        },
                        "stripe"
                      );
                    }}
                    onError={handlePaymentError}
                  />
                </div>
              </Tab>
            )}

            {/* Razorpay */}
            {availableGateways.includes("razorpay") && (
              <Tab key="razorpay" title={gatewayInfo.razorpay.name}>
                <div className="mt-4">
                  <RazorpayButton
                    amount={costDetails.total}
                    currency="INR"
                    orderData={orderDataForPayment}
                    onSuccess={async (order) => {
                      await handlePaymentSuccess(
                        {
                          razorpayOrderId: order.paymentDetails?.orderId,
                          razorpayPaymentId: order.paymentDetails?.paymentId,
                        },
                        "razorpay"
                      );
                    }}
                    onError={handlePaymentError}
                  />
                </div>
              </Tab>
            )}

            {/* PayPal */}
            {availableGateways.includes("paypal") && (
              <Tab key="paypal" title={gatewayInfo.paypal.name}>
                <div className="mt-4">
                  <PayPalButton
                    amount={costDetails.total}
                    currency={storeCurrency}
                    onSuccess={async (details) => {
                      await handlePaymentSuccess(
                        {
                          paypalOrderId: details.id,
                          paypalStatus: details.status,
                        },
                        "paypal"
                      );
                    }}
                    onError={handlePaymentError}
                  />
                </div>
              </Tab>
            )}

            {/* Cashfree */}
            {availableGateways.includes("cashfree") && (
              <Tab key="cashfree" title={gatewayInfo.cashfree.name}>
                <div className="mt-4">
                  <CashfreeButton
                    amount={costDetails.total}
                    currency="INR"
                    orderData={orderDataForPayment}
                    onSuccess={async (order) => {
                      await handlePaymentSuccess(
                        {
                          cashfreeOrderId: order.paymentDetails?.orderId,
                          cashfreeTransactionId: order.paymentDetails?.cfTransactionId,
                        },
                        "cashfree"
                      );
                    }}
                    onError={handlePaymentError}
                  />
                </div>
              </Tab>
            )}

            {/* PayU */}
            {availableGateways.includes("payu") && (
              <Tab key="payu" title={gatewayInfo.payu.name}>
                <div className="mt-4">
                  <PayUButton
                    amount={costDetails.total}
                    currency="INR"
                    orderData={orderDataForPayment}
                    onSuccess={async (order) => {
                      await handlePaymentSuccess(
                        {
                          payuTxnId: order.paymentDetails?.txnId,
                          payuMoneyId: order.paymentDetails?.payuMoneyId,
                        },
                        "payu"
                      );
                    }}
                    onError={handlePaymentError}
                  />
                </div>
              </Tab>
            )}

            {/* PhonePe */}
            {availableGateways.includes("phonepe") && (
              <Tab key="phonepe" title={gatewayInfo.phonepe.name}>
                <div className="mt-4">
                  <PhonePeButton
                    amount={costDetails.total}
                    currency="INR"
                    orderData={orderDataForPayment}
                    onSuccess={async (order) => {
                      await handlePaymentSuccess(
                        {
                          phonePeTransactionId: order.paymentDetails?.transactionId,
                          phonePeStatus: order.paymentDetails?.paymentState,
                        },
                        "phonepe"
                      );
                    }}
                    onError={handlePaymentError}
                  />
                </div>
              </Tab>
            )}

            {/* Paytm */}
            {availableGateways.includes("paytm") && (
              <Tab key="paytm" title={gatewayInfo.paytm.name}>
                <div className="mt-4">
                  <PaytmButton
                    amount={costDetails.total}
                    currency="INR"
                    orderData={orderDataForPayment}
                    onSuccess={async (order) => {
                      await handlePaymentSuccess(
                        {
                          paytmOrderId: order.paymentDetails?.orderId,
                          paytmTxnId: order.paymentDetails?.paytmTxnId,
                        },
                        "paytm"
                      );
                    }}
                    onError={handlePaymentError}
                  />
                </div>
              </Tab>
            )}
          </Tabs>
        )}

        {/* No payment gateway configured message */}
        {availableGateways.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-sm">No payment methods available</p>
            <p className="text-gray-500 text-xs mt-1">Please configure payment gateway credentials in admin panel</p>
          </div>
        )}
      </div>
    </div>
  );
}
