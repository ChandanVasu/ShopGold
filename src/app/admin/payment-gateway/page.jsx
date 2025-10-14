"use client";

import { useState, useEffect } from "react";
import { Input, Switch, Spinner, Tabs, Tab } from "@heroui/react";
import { CreditCard, Wallet, DollarSign, AlertCircle } from "lucide-react";
import CustomButton from "@/components/block/CustomButton";

export default function PaymentGatewayPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [gateways, setGateways] = useState({
    stripe: {
      enabled: false,
      publishableKey: "",
      secretKey: "",
      webhookSecret: "",
    },
    paypal: {
      enabled: false,
      clientId: "",
      clientSecret: "",
      mode: "sandbox", // sandbox or live
    },
    razorpay: {
      enabled: false,
      keyId: "",
      keySecret: "",
      webhookSecret: "",
    },
    cashfree: {
      enabled: false,
      appId: "",
      secretKey: "",
      environment: "sandbox", // sandbox or production
    },
    payu: {
      enabled: false,
      merchantKey: "",
      merchantSalt: "",
      environment: "test", // test or live
    },
    phonepe: {
      enabled: false,
      merchantId: "",
      saltKey: "",
      saltIndex: "",
      environment: "sandbox", // sandbox or production
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/setting?type=payment");
      const data = await res.json();
      if (data && Object.keys(data).length > 0) {
        setGateways({
          stripe: data.stripe || gateways.stripe,
          paypal: data.paypal || gateways.paypal,
          razorpay: data.razorpay || gateways.razorpay,
          cashfree: data.cashfree || gateways.cashfree,
          payu: data.payu || gateways.payu,
          phonepe: data.phonepe || gateways.phonepe,
        });
      }
    } catch (err) {
      console.error("Failed to fetch payment settings:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/setting?type=payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gateways),
      });

      if (res.ok) {
        alert("Payment gateway settings saved successfully!");
      } else {
        alert("Failed to save settings");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  const updateGateway = (gateway, field, value) => {
    setGateways({
      ...gateways,
      [gateway]: {
        ...gateways[gateway],
        [field]: value,
      },
    });
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <Spinner color="secondary" variant="gradient" size="md" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Gateway Settings</h1>
          <p className="text-gray-600 text-sm mt-1">Configure your payment processors and their credentials</p>
        </div>
        <CustomButton intent="primary" size="md" onPress={handleSave} isLoading={loading}>
          Save Settings
        </CustomButton>
      </div>

      {/* Warning Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900 mb-1">Important: Keep your credentials secure</h3>
          <p className="text-sm text-amber-700">
            Never share your API keys publicly. Use environment variables in production for enhanced security.
          </p>
        </div>
      </div>

      {/* Payment Gateway Tabs */}
      <div className="bg-white rounded-xl p-6">
        <Tabs aria-label="Payment Gateways" variant="underlined" color="primary">
          {/* Stripe */}
          <Tab
            key="stripe"
            title={
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Stripe</span>
              </div>
            }
          >
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Stripe Payment Gateway</h3>
                  <p className="text-sm text-gray-500">Accept cards, wallets, and more</p>
                </div>
                <Switch
                  isSelected={gateways.stripe.enabled}
                  onValueChange={(value) => updateGateway("stripe", "enabled", value)}
                  color="success"
                />
              </div>

              <Input
                label="Publishable Key"
                labelPlacement="outside"
                placeholder="pk_test_..."
                value={gateways.stripe.publishableKey}
                onChange={(e) => updateGateway("stripe", "publishableKey", e.target.value)}
                disabled={!gateways.stripe.enabled}
              />

              <Input
                label="Secret Key"
                labelPlacement="outside"
                type="password"
                placeholder="sk_test_..."
                value={gateways.stripe.secretKey}
                onChange={(e) => updateGateway("stripe", "secretKey", e.target.value)}
                disabled={!gateways.stripe.enabled}
              />

              <Input
                label="Webhook Secret"
                labelPlacement="outside"
                type="password"
                placeholder="whsec_..."
                value={gateways.stripe.webhookSecret}
                onChange={(e) => updateGateway("stripe", "webhookSecret", e.target.value)}
                disabled={!gateways.stripe.enabled}
              />
            </div>
          </Tab>

          {/* PayPal */}
          <Tab
            key="paypal"
            title={
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span>PayPal</span>
              </div>
            }
          >
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">PayPal Payment Gateway</h3>
                  <p className="text-sm text-gray-500">Accept PayPal payments</p>
                </div>
                <Switch
                  isSelected={gateways.paypal.enabled}
                  onValueChange={(value) => updateGateway("paypal", "enabled", value)}
                  color="success"
                />
              </div>

              <Input
                label="Client ID"
                labelPlacement="outside"
                placeholder="Your PayPal Client ID"
                value={gateways.paypal.clientId}
                onChange={(e) => updateGateway("paypal", "clientId", e.target.value)}
                disabled={!gateways.paypal.enabled}
              />

              <Input
                label="Client Secret"
                labelPlacement="outside"
                type="password"
                placeholder="Your PayPal Client Secret"
                value={gateways.paypal.clientSecret}
                onChange={(e) => updateGateway("paypal", "clientSecret", e.target.value)}
                disabled={!gateways.paypal.enabled}
              />

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Environment</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paypal-mode"
                      checked={gateways.paypal.mode === "sandbox"}
                      onChange={() => updateGateway("paypal", "mode", "sandbox")}
                      disabled={!gateways.paypal.enabled}
                    />
                    <span className="text-sm">Sandbox</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paypal-mode"
                      checked={gateways.paypal.mode === "live"}
                      onChange={() => updateGateway("paypal", "mode", "live")}
                      disabled={!gateways.paypal.enabled}
                    />
                    <span className="text-sm">Live</span>
                  </label>
                </div>
              </div>
            </div>
          </Tab>

          {/* Razorpay */}
          <Tab
            key="razorpay"
            title={
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>Razorpay</span>
              </div>
            }
          >
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Razorpay Payment Gateway</h3>
                  <p className="text-sm text-gray-500">India's leading payment gateway</p>
                </div>
                <Switch
                  isSelected={gateways.razorpay.enabled}
                  onValueChange={(value) => updateGateway("razorpay", "enabled", value)}
                  color="success"
                />
              </div>

              <Input
                label="Key ID"
                labelPlacement="outside"
                placeholder="rzp_test_..."
                value={gateways.razorpay.keyId}
                onChange={(e) => updateGateway("razorpay", "keyId", e.target.value)}
                disabled={!gateways.razorpay.enabled}
              />

              <Input
                label="Key Secret"
                labelPlacement="outside"
                type="password"
                placeholder="Your Razorpay Key Secret"
                value={gateways.razorpay.keySecret}
                onChange={(e) => updateGateway("razorpay", "keySecret", e.target.value)}
                disabled={!gateways.razorpay.enabled}
              />

              <Input
                label="Webhook Secret"
                labelPlacement="outside"
                type="password"
                placeholder="Your Webhook Secret"
                value={gateways.razorpay.webhookSecret}
                onChange={(e) => updateGateway("razorpay", "webhookSecret", e.target.value)}
                disabled={!gateways.razorpay.enabled}
              />
            </div>
          </Tab>

          {/* Cashfree */}
          <Tab key="cashfree" title="Cashfree">
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Cashfree Payment Gateway</h3>
                  <p className="text-sm text-gray-500">Cashfree Payments</p>
                </div>
                <Switch
                  isSelected={gateways.cashfree.enabled}
                  onValueChange={(value) => updateGateway("cashfree", "enabled", value)}
                  color="success"
                />
              </div>

              <Input
                label="App ID"
                labelPlacement="outside"
                placeholder="Your Cashfree App ID"
                value={gateways.cashfree.appId}
                onChange={(e) => updateGateway("cashfree", "appId", e.target.value)}
                disabled={!gateways.cashfree.enabled}
              />

              <Input
                label="Secret Key"
                labelPlacement="outside"
                type="password"
                placeholder="Your Cashfree Secret Key"
                value={gateways.cashfree.secretKey}
                onChange={(e) => updateGateway("cashfree", "secretKey", e.target.value)}
                disabled={!gateways.cashfree.enabled}
              />

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Environment</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="cashfree-env"
                      checked={gateways.cashfree.environment === "sandbox"}
                      onChange={() => updateGateway("cashfree", "environment", "sandbox")}
                      disabled={!gateways.cashfree.enabled}
                    />
                    <span className="text-sm">Sandbox</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="cashfree-env"
                      checked={gateways.cashfree.environment === "production"}
                      onChange={() => updateGateway("cashfree", "environment", "production")}
                      disabled={!gateways.cashfree.enabled}
                    />
                    <span className="text-sm">Production</span>
                  </label>
                </div>
              </div>
            </div>
          </Tab>

          {/* PayU */}
          <Tab key="payu" title="PayU">
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">PayU Payment Gateway</h3>
                  <p className="text-sm text-gray-500">PayU Money</p>
                </div>
                <Switch
                  isSelected={gateways.payu.enabled}
                  onValueChange={(value) => updateGateway("payu", "enabled", value)}
                  color="success"
                />
              </div>

              <Input
                label="Merchant Key"
                labelPlacement="outside"
                placeholder="Your PayU Merchant Key"
                value={gateways.payu.merchantKey}
                onChange={(e) => updateGateway("payu", "merchantKey", e.target.value)}
                disabled={!gateways.payu.enabled}
              />

              <Input
                label="Merchant Salt"
                labelPlacement="outside"
                type="password"
                placeholder="Your PayU Merchant Salt"
                value={gateways.payu.merchantSalt}
                onChange={(e) => updateGateway("payu", "merchantSalt", e.target.value)}
                disabled={!gateways.payu.enabled}
              />

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Environment</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payu-env"
                      checked={gateways.payu.environment === "test"}
                      onChange={() => updateGateway("payu", "environment", "test")}
                      disabled={!gateways.payu.enabled}
                    />
                    <span className="text-sm">Test</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payu-env"
                      checked={gateways.payu.environment === "live"}
                      onChange={() => updateGateway("payu", "environment", "live")}
                      disabled={!gateways.payu.enabled}
                    />
                    <span className="text-sm">Live</span>
                  </label>
                </div>
              </div>
            </div>
          </Tab>

          {/* PhonePe */}
          <Tab key="phonepe" title="PhonePe">
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">PhonePe Payment Gateway</h3>
                  <p className="text-sm text-gray-500">PhonePe Business</p>
                </div>
                <Switch
                  isSelected={gateways.phonepe.enabled}
                  onValueChange={(value) => updateGateway("phonepe", "enabled", value)}
                  color="success"
                />
              </div>

              <Input
                label="Merchant ID"
                labelPlacement="outside"
                placeholder="Your PhonePe Merchant ID"
                value={gateways.phonepe.merchantId}
                onChange={(e) => updateGateway("phonepe", "merchantId", e.target.value)}
                disabled={!gateways.phonepe.enabled}
              />

              <Input
                label="Salt Key"
                labelPlacement="outside"
                type="password"
                placeholder="Your PhonePe Salt Key"
                value={gateways.phonepe.saltKey}
                onChange={(e) => updateGateway("phonepe", "saltKey", e.target.value)}
                disabled={!gateways.phonepe.enabled}
              />

              <Input
                label="Salt Index"
                labelPlacement="outside"
                placeholder="1"
                value={gateways.phonepe.saltIndex}
                onChange={(e) => updateGateway("phonepe", "saltIndex", e.target.value)}
                disabled={!gateways.phonepe.enabled}
              />

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Environment</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="phonepe-env"
                      checked={gateways.phonepe.environment === "sandbox"}
                      onChange={() => updateGateway("phonepe", "environment", "sandbox")}
                      disabled={!gateways.phonepe.enabled}
                    />
                    <span className="text-sm">Sandbox</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="phonepe-env"
                      checked={gateways.phonepe.environment === "production"}
                      onChange={() => updateGateway("phonepe", "environment", "production")}
                      disabled={!gateways.phonepe.enabled}
                    />
                    <span className="text-sm">Production</span>
                  </label>
                </div>
              </div>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
