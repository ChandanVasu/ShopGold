"use client";

import { useState, useEffect } from "react";
import { Input, Textarea, Select, SelectItem, Spinner } from "@heroui/react";
import { Store, Globe, DollarSign, FileText, Mail, Phone, MapPin } from "lucide-react";
import CustomButton from "@/components/block/CustomButton";
import ImageSelector from "@/components/block/ImageSelector";

export default function StoreSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [faviconModalOpen, setFaviconModalOpen] = useState(false);
  const [footerLogoModalOpen, setFooterLogoModalOpen] = useState(false);

  const currencies = [
    { label: "US Dollar ($)", value: "USD", symbol: "$" },
    { label: "Indian Rupee (₹)", value: "INR", symbol: "₹" },
    { label: "Euro (€)", value: "EUR", symbol: "€" },
    { label: "British Pound (£)", value: "GBP", symbol: "£" },
    { label: "Australian Dollar (A$)", value: "AUD", symbol: "A$" },
    { label: "Canadian Dollar (C$)", value: "CAD", symbol: "C$" },
  ];

  const [settings, setSettings] = useState({
    // Header Settings
    storeName: "",
    textLogo: "",
    websiteDescription: "",
    logoImage: "",
    faviconImage: "",
    storeCurrency: "USD",
    currencySymbol: "$",

    // Footer Settings
    footerTextLogo: "",
    copyrightText: "",
    footerEmail: "",
    footerPhone: "",
    footerAddress: "",
    footerLogo: "",
    footerAbout: "",
    facebookUrl: "",
    twitterUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
    whatsappNumber: "",
    footerColumn1Title: "",
    footerColumn1Links: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/setting?type=store");
      const data = await res.json();
      if (data && Object.keys(data).length > 0) {
        setSettings({
          storeName: data.storeName || "",
          textLogo: data.textLogo || "",
          websiteDescription: data.websiteDescription || "",
          logoImage: data.logoImage || "",
          faviconImage: data.faviconImage || "",
          storeCurrency: data.storeCurrency || "USD",
          currencySymbol: data.currencySymbol || "$",
          footerTextLogo: data.footerTextLogo || "",
          copyrightText: data.copyrightText || "",
          footerEmail: data.footerEmail || "",
          footerPhone: data.footerPhone || "",
          footerAddress: data.footerAddress || "",
          footerLogo: data.footerLogo || "",
          footerAbout: data.footerAbout || "",
          facebookUrl: data.facebookUrl || "",
          twitterUrl: data.twitterUrl || "",
          instagramUrl: data.instagramUrl || "",
          linkedinUrl: data.linkedinUrl || "",
          youtubeUrl: data.youtubeUrl || "",
          whatsappNumber: data.whatsappNumber || "",
          footerColumn1Title: data.footerColumn1Title || "",
          footerColumn1Links: data.footerColumn1Links || "",
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
      const res = await fetch("/api/setting?type=store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        alert("Settings saved successfully!");
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

  const handleCurrencyChange = (key) => {
    const selected = currencies.find((c) => c.value === key);
    if (selected) {
      setSettings({
        ...settings,
        storeCurrency: selected.value,
        currencySymbol: selected.symbol,
      });
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-600 text-sm mt-1">Configure your store information, branding, and currency</p>
        </div>
        <CustomButton intent="primary" size="md" onPress={handleSave} isLoading={loading}>
          Save Settings
        </CustomButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Header Settings */}
        <div className="bg-white rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Header Settings</h2>
              <p className="text-sm text-gray-500">Configure your store header and branding</p>
            </div>
          </div>

          <Input
            label="Store Name"
            labelPlacement="outside"
            placeholder="Shop Gold"
            value={settings.storeName}
            onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
            description="Your store's official name"
          />

          <Input
            label="Text Logo"
            labelPlacement="outside"
            placeholder="SHOP GOLD"
            value={settings.textLogo}
            onChange={(e) => setSettings({ ...settings, textLogo: e.target.value })}
            description="Text to display as logo if no image is set"
          />

          <Textarea
            label="Website Description"
            labelPlacement="outside"
            placeholder="Your one-stop shop for premium products..."
            value={settings.websiteDescription}
            onChange={(e) => setSettings({ ...settings, websiteDescription: e.target.value })}
            description="SEO meta description for your site"
          />

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Logo Image</label>
            <div
              onClick={() => setLogoModalOpen(true)}
              className="flex justify-center items-center border-2 border-dashed rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              style={{
                height: settings.logoImage ? "auto" : "120px",
                backgroundColor: settings.logoImage ? "transparent" : "#f9f9f9",
              }}
            >
              {settings.logoImage ? (
                <img src={settings.logoImage} alt="Logo" className="max-h-24 object-contain rounded-lg p-2" />
              ) : (
                <span className="text-gray-400 text-sm">Click to select logo</span>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Favicon Image</label>
            <div
              onClick={() => setFaviconModalOpen(true)}
              className="flex justify-center items-center border-2 border-dashed rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              style={{
                height: settings.faviconImage ? "auto" : "100px",
                backgroundColor: settings.faviconImage ? "transparent" : "#f9f9f9",
              }}
            >
              {settings.faviconImage ? (
                <img src={settings.faviconImage} alt="Favicon" className="h-16 w-16 object-contain rounded-lg" />
              ) : (
                <span className="text-gray-400 text-sm">Click to select favicon</span>
              )}
            </div>
          </div>

          <Select
            label="Store Currency"
            labelPlacement="outside"
            placeholder="Select currency"
            selectedKeys={[settings.storeCurrency]}
            onSelectionChange={(keys) => handleCurrencyChange(Array.from(keys)[0])}
            startContent={<DollarSign className="w-4 h-4 text-gray-500" />}
          >
            {currencies.map((currency) => (
              <SelectItem key={currency.value}>{currency.label}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Footer Settings */}
        <div className="bg-white rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-purple-50 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Footer Settings</h2>
              <p className="text-sm text-gray-500">Configure your store footer information</p>
            </div>
          </div>

          <Input
            label="Footer Text Logo"
            labelPlacement="outside"
            placeholder="SHOP GOLD"
            value={settings.footerTextLogo}
            onChange={(e) => setSettings({ ...settings, footerTextLogo: e.target.value })}
            description="Text logo for footer"
          />

          <Textarea
            label="Copyright Text"
            labelPlacement="outside"
            placeholder="© 2025 Shop Gold. All rights reserved."
            value={settings.copyrightText}
            onChange={(e) => setSettings({ ...settings, copyrightText: e.target.value })}
            description="Copyright notice displayed in footer"
          />

          <Input
            label="Email"
            labelPlacement="outside"
            type="email"
            placeholder="contact@shopgold.com"
            value={settings.footerEmail}
            onChange={(e) => setSettings({ ...settings, footerEmail: e.target.value })}
            startContent={<Mail className="w-4 h-4 text-gray-500" />}
          />

          <Input
            label="Phone"
            labelPlacement="outside"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={settings.footerPhone}
            onChange={(e) => setSettings({ ...settings, footerPhone: e.target.value })}
            startContent={<Phone className="w-4 h-4 text-gray-500" />}
          />

          <Textarea
            label="Address"
            labelPlacement="outside"
            placeholder="123 Main Street, City, Country"
            value={settings.footerAddress}
            onChange={(e) => setSettings({ ...settings, footerAddress: e.target.value })}
            startContent={<MapPin className="w-4 h-4 text-gray-500" />}
          />

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Footer Logo</label>
            <div
              onClick={() => setFooterLogoModalOpen(true)}
              className="flex justify-center items-center border-2 border-dashed rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              style={{
                height: settings.footerLogo ? "auto" : "120px",
                backgroundColor: settings.footerLogo ? "transparent" : "#f9f9f9",
              }}
            >
              {settings.footerLogo ? (
                <img src={settings.footerLogo} alt="Footer Logo" className="max-h-24 object-contain rounded-lg p-2" />
              ) : (
                <span className="text-gray-400 text-sm">Click to select footer logo</span>
              )}
            </div>
          </div>

          <Textarea
            label="About Description"
            labelPlacement="outside"
            placeholder="Brief description about your store..."
            value={settings.footerAbout}
            onChange={(e) => setSettings({ ...settings, footerAbout: e.target.value })}
            description="Short description for footer about section"
          />
        </div>

        {/* Social Media Links */}
        <div className="bg-white rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-green-50 rounded-lg">
              <Globe className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Social Media Links</h2>
              <p className="text-sm text-gray-500">Configure your social media presence</p>
            </div>
          </div>

          <Input
            label="Facebook URL"
            labelPlacement="outside"
            placeholder="https://facebook.com/yourpage"
            value={settings.facebookUrl}
            onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
          />

          <Input
            label="Twitter URL"
            labelPlacement="outside"
            placeholder="https://twitter.com/yourhandle"
            value={settings.twitterUrl}
            onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
          />

          <Input
            label="Instagram URL"
            labelPlacement="outside"
            placeholder="https://instagram.com/yourhandle"
            value={settings.instagramUrl}
            onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
          />

          <Input
            label="LinkedIn URL"
            labelPlacement="outside"
            placeholder="https://linkedin.com/company/yourcompany"
            value={settings.linkedinUrl}
            onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
          />

          <Input
            label="YouTube URL"
            labelPlacement="outside"
            placeholder="https://youtube.com/yourchannel"
            value={settings.youtubeUrl}
            onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })}
          />

          <Input
            label="WhatsApp Number"
            labelPlacement="outside"
            placeholder="+1234567890"
            value={settings.whatsappNumber}
            onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
            description="Include country code without + or spaces"
          />
        </div>

        {/* Footer Columns */}
        <div className="bg-white rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-orange-50 rounded-lg">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Footer Menu Column</h2>
              <p className="text-sm text-gray-500">Configure footer menu section (1 column)</p>
            </div>
          </div>

          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-700">Menu Column</h3>
            <Input
              label="Title"
              labelPlacement="outside"
              placeholder="Company"
              value={settings.footerColumn1Title}
              onChange={(e) => setSettings({ ...settings, footerColumn1Title: e.target.value })}
            />
            <Textarea
              label="Links (one per line)"
              labelPlacement="outside"
              placeholder="About Us|/about&#10;Contact|/contact&#10;Careers|/careers&#10;Blog|/blog"
              value={settings.footerColumn1Links}
              onChange={(e) => setSettings({ ...settings, footerColumn1Links: e.target.value })}
              description="Format: Link Text|URL (one per line)"
              rows={4}
            />
          </div>


        </div>
      </div>

      {/* Image Selectors */}
      <ImageSelector isOpen={logoModalOpen} onClose={() => setLogoModalOpen(false)} onSelectImages={(url) => setSettings({ ...settings, logoImage: url })} selectType="single" />
      <ImageSelector isOpen={faviconModalOpen} onClose={() => setFaviconModalOpen(false)} onSelectImages={(url) => setSettings({ ...settings, faviconImage: url })} selectType="single" />
      <ImageSelector isOpen={footerLogoModalOpen} onClose={() => setFooterLogoModalOpen(false)} onSelectImages={(url) => setSettings({ ...settings, footerLogo: url })} selectType="single" />
    </div>
  );
}
