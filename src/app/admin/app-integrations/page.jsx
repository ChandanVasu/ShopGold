"use client";

import { useState, useEffect } from "react";
import { Input, Textarea, Spinner } from "@heroui/react";
import { Code, Trash2, Plus, BarChart3, Share2 } from "lucide-react";
import CustomButton from "@/components/block/CustomButton";

export default function AppIntegrationsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [integrations, setIntegrations] = useState({
    googleAnalytics: [],
    metaPixel: [],
    googleTagManager: [],
    googleAds: [],
    customCode: [],
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/setting?type=integrations");
      const data = await res.json();
      if (data && Object.keys(data).length > 0) {
        setIntegrations({
          googleAnalytics: data.googleAnalytics || [],
          metaPixel: data.metaPixel || [],
          googleTagManager: data.googleTagManager || [],
          googleAds: data.googleAds || [],
          customCode: data.customCode || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch integration settings:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/setting?type=integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(integrations),
      });

      if (res.ok) {
        alert("Integration settings saved successfully!");
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

  // Helper functions for array management
  const addItem = (type) => {
    setIntegrations({
      ...integrations,
      [type]: [
        ...integrations[type],
        type === "customCode"
          ? { name: "", code: "" }
          : { id: "", name: "" },
      ],
    });
  };

  const removeItem = (type, index) => {
    setIntegrations({
      ...integrations,
      [type]: integrations[type].filter((_, i) => i !== index),
    });
  };

  const updateItem = (type, index, field, value) => {
    const updated = [...integrations[type]];
    updated[index][field] = value;
    setIntegrations({
      ...integrations,
      [type]: updated,
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
          <h1 className="text-2xl font-bold text-gray-900">App Integrations</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage analytics, tracking pixels, and custom scripts
          </p>
        </div>
        <CustomButton intent="primary" size="md" onPress={handleSave} isLoading={loading}>
          Save Settings
        </CustomButton>
      </div>

      <div className="space-y-6">
        {/* Google Analytics */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Google Analytics</h2>
                <p className="text-sm text-gray-500">Add multiple GA4 measurement IDs</p>
              </div>
            </div>
            <CustomButton
              intent="ghost"
              size="sm"
              onPress={() => addItem("googleAnalytics")}
              startContent={<Plus className="w-4 h-4" />}
            >
              Add GA4
            </CustomButton>
          </div>

          {integrations.googleAnalytics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No Google Analytics configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.googleAnalytics.map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Account Name (e.g., Main Account)"
                      value={item.name}
                      onChange={(e) =>
                        updateItem("googleAnalytics", index, "name", e.target.value)
                      }
                      size="sm"
                    />
                    <Input
                      placeholder="G-XXXXXXXXXX"
                      value={item.id}
                      onChange={(e) =>
                        updateItem("googleAnalytics", index, "id", e.target.value)
                      }
                      size="sm"
                    />
                  </div>
                  <button
                    onClick={() => removeItem("googleAnalytics", index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meta Pixel */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Share2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Meta Pixel (Facebook)</h2>
                <p className="text-sm text-gray-500">Add multiple Facebook Pixel IDs</p>
              </div>
            </div>
            <CustomButton
              intent="ghost"
              size="sm"
              onPress={() => addItem("metaPixel")}
              startContent={<Plus className="w-4 h-4" />}
            >
              Add Pixel
            </CustomButton>
          </div>

          {integrations.metaPixel.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Share2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No Meta Pixel configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.metaPixel.map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Ad Account Name"
                      value={item.name}
                      onChange={(e) =>
                        updateItem("metaPixel", index, "name", e.target.value)
                      }
                      size="sm"
                    />
                    <Input
                      placeholder="Pixel ID (numbers only)"
                      value={item.id}
                      onChange={(e) =>
                        updateItem("metaPixel", index, "id", e.target.value)
                      }
                      size="sm"
                    />
                  </div>
                  <button
                    onClick={() => removeItem("metaPixel", index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Google Tag Manager */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Code className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Google Tag Manager</h2>
                <p className="text-sm text-gray-500">Add multiple GTM container IDs</p>
              </div>
            </div>
            <CustomButton
              intent="ghost"
              size="sm"
              onPress={() => addItem("googleTagManager")}
              startContent={<Plus className="w-4 h-4" />}
            >
              Add GTM
            </CustomButton>
          </div>

          {integrations.googleTagManager.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Code className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No Google Tag Manager configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.googleTagManager.map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Container Name"
                      value={item.name}
                      onChange={(e) =>
                        updateItem("googleTagManager", index, "name", e.target.value)
                      }
                      size="sm"
                    />
                    <Input
                      placeholder="GTM-XXXXXXX"
                      value={item.id}
                      onChange={(e) =>
                        updateItem("googleTagManager", index, "id", e.target.value)
                      }
                      size="sm"
                    />
                  </div>
                  <button
                    onClick={() => removeItem("googleTagManager", index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Google Ads */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Google Ads</h2>
                <p className="text-sm text-gray-500">Add Google Ads conversion tracking</p>
              </div>
            </div>
            <CustomButton
              intent="ghost"
              size="sm"
              onPress={() => addItem("googleAds")}
              startContent={<Plus className="w-4 h-4" />}
            >
              Add Google Ads
            </CustomButton>
          </div>

          {integrations.googleAds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No Google Ads configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.googleAds.map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Campaign Name"
                      value={item.name}
                      onChange={(e) =>
                        updateItem("googleAds", index, "name", e.target.value)
                      }
                      size="sm"
                    />
                    <Input
                      placeholder="AW-XXXXXXXXXX"
                      value={item.id}
                      onChange={(e) =>
                        updateItem("googleAds", index, "id", e.target.value)
                      }
                      size="sm"
                    />
                  </div>
                  <button
                    onClick={() => removeItem("googleAds", index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Code */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Code className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Custom Code</h2>
                <p className="text-sm text-gray-500">
                  Add custom scripts to the header of all pages
                </p>
              </div>
            </div>
            <CustomButton
              intent="ghost"
              size="sm"
              onPress={() => addItem("customCode")}
              startContent={<Plus className="w-4 h-4" />}
            >
              Add Code
            </CustomButton>
          </div>

          {integrations.customCode.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Code className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No custom code added</p>
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.customCode.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder="Script Name/Description"
                      value={item.name}
                      onChange={(e) =>
                        updateItem("customCode", index, "name", e.target.value)
                      }
                      size="sm"
                      className="flex-1"
                    />
                    <button
                      onClick={() => removeItem("customCode", index)}
                      className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Textarea
                    placeholder="<script>&#10;  // Your custom code here&#10;</script>"
                    value={item.code}
                    onChange={(e) =>
                      updateItem("customCode", index, "code", e.target.value)
                    }
                    minRows={6}
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
