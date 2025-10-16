"use client";

import { useState, useEffect } from "react";
import { Badge, Spinner, Switch, Input } from "@heroui/react";
import { CheckCircle, XCircle, Settings, Globe } from "lucide-react";
import CustomButton from "@/components/block/CustomButton";

export default function PaymentMethodsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [gateways, setGateways] = useState({
    stripe: { enabled: false, publishableKey: "", secretKey: "", webhookSecret: "" },
    paypal: { enabled: false, clientId: "", clientSecret: "", mode: "sandbox" },
    razorpay: { enabled: false, keyId: "", keySecret: "", webhookSecret: "" },
  });

  const gatewayConfig = {
    stripe: {
      name: "Stripe",
      description: "Global payment processing",
      status: "active",
      logo: "/stripe.png",
      note: "Needs setup",
    },
    paypal: {
      name: "PayPal",
      description: "Digital wallet and payments",
      status: "active",
      logo: "/PayPal.png",
      note: "Needs setup",
    },
  };

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
        });
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
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
      if (res.ok) alert("Settings saved successfully!");
      else alert("Failed to save settings");
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  const updateGateway = (key, field, value) => {
    setGateways({
      ...gateways,
      [key]: { ...gateways[key], [field]: value },
    });
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner color="secondary" variant="gradient" size="lg" />
      </div>
    );
  }

  return (
    <div className="md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600 mt-1">Configure your payment gateways and manage transaction settings</p>
        </div>
        <CustomButton intent="primary" size="lg" isLoading={loading} onPress={handleSave} className="px-6">
          <Settings className="w-4 h-4 mr-2" /> Save Changes
        </CustomButton>
      </div>

      {/* Payment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(gatewayConfig).map(([key, config]) => {
          const gateway = gateways[key];
          const isActive = gateway.enabled;

          return (
            <div key={key} className="bg-white rounded-lg  p-6">
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <img src={config.logo} alt={config.name} className="h-8 w-auto" />
                  </div>
                  {config.status === "coming" && <span className="text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-1 rounded-md">Coming Soon</span>}
                </div>

                <p className="text-sm text-gray-600">{config.description}</p>

                <div className="flex items-center justify-between">
                  <Switch isSelected={isActive} isDisabled={config.status === "coming"} onValueChange={(v) => updateGateway(key, "enabled", v)} color="success" size="lg" />
                  <div className="flex items-center gap-2">
                    {isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                    <span className={`text-xs font-medium ${isActive ? "text-green-600" : "text-gray-500"}`}>{isActive ? "Active" : "Inactive"}</span>
                  </div>
                </div>

                {config.note && config.status === "active" && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Globe className="w-3 h-3 text-orange-400" />
                    <span>{config.note}</span>
                  </div>
                )}

                {/* Configuration Fields */}
                {isActive && (
                  <div className="space-y-8 mt-4">
                    {key === "stripe" && (
                      <>
                        <Input
                          labelPlacement="outside"
                          label="Publishable Key"
                          placeholder="pk_test_..."
                          value={gateway.publishableKey}
                          onChange={(e) => updateGateway(key, "publishableKey", e.target.value)}
                        />
                        <Input
                          labelPlacement="outside"
                          label="Secret Key"
                          placeholder="sk_test_..."
                          type="password"
                          value={gateway.secretKey}
                          onChange={(e) => updateGateway(key, "secretKey", e.target.value)}
                        />
                        <Input
                          labelPlacement="outside"
                          label="Webhook Secret"
                          placeholder="whsec_..."
                          type="password"
                          value={gateway.webhookSecret}
                          onChange={(e) => updateGateway(key, "webhookSecret", e.target.value)}
                        />
                      </>
                    )}

                    {key === "paypal" && (
                      <>
                        <Input
                          labelPlacement="outside"
                          label="Client ID"
                          placeholder="Your PayPal Client ID"
                          value={gateway.clientId}
                          onChange={(e) => updateGateway(key, "clientId", e.target.value)}
                        />
                        <Input
                          labelPlacement="outside"
                          label="Client Secret"
                          placeholder="Your PayPal Client Secret"
                          type="password"
                          value={gateway.clientSecret}
                          onChange={(e) => updateGateway(key, "clientSecret", e.target.value)}
                        />
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Environment</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Input
                                labelPlacement="outside"
                                type="radio"
                                name={`${key}-mode`}
                                checked={gateway.mode === "sandbox"}
                                onChange={() => updateGateway(key, "mode", "sandbox")}
                                className="text-blue-500"
                              />
                              <span className="text-sm">Sandbox</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Input
                                labelPlacement="outside"
                                type="radio"
                                name={`${key}-mode`}
                                checked={gateway.mode === "live"}
                                onChange={() => updateGateway(key, "mode", "live")}
                                className="text-blue-500"
                              />
                              <span className="text-sm">Live</span>
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
