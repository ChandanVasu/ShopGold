"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Input, Select, SelectItem, Textarea } from "@heroui/react";
import { ArrowLeft, Package, Plus, X, Save } from "lucide-react";
import CustomButton from "@/components/block/CustomButton";
import ImageSelector from "@/components/block/ImageSelector";

const TextEditor = dynamic(() => import("@/components/block/TextEditor"), { ssr: false });

function ProductForm() {
  const searchParams = useSearchParams();

  const productId = searchParams?.get("productId") || "";
  const isUpdate = searchParams?.get("isUpdate") === "true";

  const [addLoading, setAddLoading] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [categories, setCategories] = useState(new Set());
  const [fetchingCollection, setFetchingCollection] = useState([]);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  const [variantInput, setVariantInput] = useState({ name: "", options: "" });

  const fetchCollection = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(`/api/collection`, { cache: "reload" });
      const data = await response.json();
      if (response.ok) {
        setFetchingCollection(data);
      }
    } catch (error) {
      console.error("Fetch failed:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, []);

  const [productData, setProductData] = useState({
    title: "",
    description: "",
    shortDescription: "",
    regularPrice: "",
    salePrice: "",
    sku: "",
    stockQuantity: "",
    brand: "",
    barcode: "",
    productLabel: "",
    tags: "",
    supplier: "",
    status: "Active",
    stockStatus: "In Stock",
    costPerItem: "",
    variants: [], // ✅ New: variants
    rating: "", // ✅ Star rating (1-5)
    limitedTimeDeal: "", // ✅ Limited time deal end date/time
  });

  const visibilityOptions = ["Active", "Inactive"];
  const stockStatusOptions = ["In Stock", "Out of Stock"];
  const productLabelOptions = ["Trending", "New", "Hot", "Best Seller", "Limited Edition", "Sale", "Exclusive", "None"];

  useEffect(() => {
    const fetchProductById = async () => {
      if (!isUpdate || !productId) return;

      try {
        const res = await fetch(`/api/product/${productId}`);
        const data = await res.json();

        setProductData({
          title: data.title || "",
          description: data.description || "",
          shortDescription: data.shortDescription || "",
          regularPrice: data.regularPrice || "",
          salePrice: data.salePrice || "",
          sku: data.sku || "",
          stockQuantity: data.stockQuantity || "",
          brand: data.brand || "",
          barcode: data.barcode || "",
          productLabel: data.productLabel || "",
          tags: data.tags || "",
          supplier: data.supplier || "",
          status: data.status || "Active",
          stockStatus: data.stockStatus || "In Stock",
          costPerItem: data.costPerItem || "",
          variants: data.variants || [], // ✅ load existing variants
          rating: data.rating || "",
          limitedTimeDeal: data.limitedTimeDeal || "",
        });

        setSelectedImages(data.images || []);
        setCategories(new Set(data.collections || []));
      } catch (error) {
        console.error("❌ Failed to fetch product:", error);
      }
    };

    fetchProductById();
  }, [isUpdate, productId]);

  const handleCategoryChange = (keys) => setCategories(new Set(keys));

  const addVariant = () => {
    if (!variantInput.name || !variantInput.options) return;

    const newVariant = {
      name: variantInput.name,
      options: variantInput.options.split(",").map((opt) => opt.trim()),
    };

    setProductData((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));

    setVariantInput({ name: "", options: "" });
  };

  const removeVariant = (index) => {
    setProductData((prev) => {
      const updated = [...prev.variants];
      updated.splice(index, 1);
      return { ...prev, variants: updated };
    });
  };

  const addOrUpdateProduct = async () => {
    setAddLoading(true);

    if (!productData.title || !productData.regularPrice) {
      setIsInvalid(true);
      setAddLoading(false);
      return;
    }

    try {
      const method = isUpdate ? "PUT" : "POST";
      const response = await fetch("/api/product", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isUpdate && { _id: productId }),
          ...productData,
          collections: Array.from(categories),
          images: selectedImages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API Error:", errorData);
        throw new Error(`Error: ${response.statusText}`);
      }

      // Optional: toast.success("Product saved"); router.push("/admin/products");
    } catch (error) {
      console.error("❌ Error saving product:", error);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6  mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/product">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isUpdate ? "Edit Product" : "Add Product"}</h1>
            <p className="text-gray-600 text-sm">{isUpdate ? "Update product information" : "Create a new product for your store"}</p>
          </div>
        </div>
        <CustomButton
          intent="primary"
          size="md"
          isLoading={addLoading}
          onPress={addOrUpdateProduct}
          startContent={<Save className="w-4 h-4" />}
          tooltip={isUpdate ? "Update product information" : "Save this product to your store"}
        >
          {isUpdate ? "Update Product" : "Save Product"}
        </CustomButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-8">Basic Information</h2>
            <div className="space-y-4">
              <Input
                label="Product Name"
                labelPlacement="outside"
                isDisabled={isFetching}
                placeholder="Enter product name"
                value={productData.title}
                isInvalid={isInvalid && !productData.title}
                errorMessage="Product name is required"
                onChange={(e) => setProductData({ ...productData, title: e.target.value })}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium text-gray-700",
                }}
              />

              <Textarea
                label="Short Description"
                isDisabled={isFetching}
                labelPlacement="outside"
                placeholder="Brief product summary..."
                value={productData.shortDescription}
                onChange={(e) => setProductData({ ...productData, shortDescription: e.target.value })}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium text-gray-700",
                }}
              />

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Product Description</label>
                <TextEditor value={productData.description} onChange={(value) => setProductData((prev) => ({ ...prev, description: value }))} />
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {selectedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img src={img} alt={`Product ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                  <button
                    onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                className="flex items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                onClick={() => setIsImageSelectorOpen(true)}
              >
                <div className="text-center">
                  <Plus className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <span className="text-sm text-gray-500">Add Image</span>
                </div>
              </button>
            </div>
            <ImageSelector isOpen={isImageSelectorOpen} onClose={() => setIsImageSelectorOpen(false)} onSelectImages={(urls) => setSelectedImages(urls)} selectType="multiple" />
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Regular Price"
                labelPlacement="outside"
                type="number"
                isDisabled={isFetching}
                startContent={<span className="text-gray-500 text-sm">{process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$"}</span>}
                placeholder="0.00"
                value={productData.regularPrice}
                isInvalid={isInvalid && !productData.regularPrice}
                errorMessage="Price is required"
                onChange={(e) => setProductData({ ...productData, regularPrice: e.target.value })}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium text-gray-700",
                }}
              />
              <Input
                label="Sale Price"
                labelPlacement="outside"
                type="number"
                isDisabled={isFetching}
                startContent={<span className="text-gray-500 text-sm">{process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$"}</span>}
                placeholder="0.00"
                value={productData.salePrice}
                onChange={(e) => setProductData({ ...productData, salePrice: e.target.value })}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium text-gray-700",
                }}
              />
              <Input
                label="Cost per Item"
                labelPlacement="outside"
                type="number"
                isDisabled={isFetching}
                startContent={<span className="text-gray-500 text-sm">{process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$"}</span>}
                placeholder="0.00"
                value={productData.costPerItem}
                onChange={(e) => setProductData({ ...productData, costPerItem: e.target.value })}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium text-gray-700",
                }}
              />
              <Input
                label="Profit"
                labelPlacement="outside"
                isDisabled={true}
                startContent={<span className="text-gray-500 text-sm">{process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$"}</span>}
                placeholder="Auto-calculated"
                value={productData.costPerItem ? (parseFloat(productData.salePrice || productData.regularPrice || "0") - parseFloat(productData.costPerItem || "0")).toFixed(2) : ""}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium text-gray-700",
                }}
              />
              <Input
                label="SKU"
                labelPlacement="outside"
                isDisabled={isFetching}
                placeholder="Product code"
                value={productData.sku}
                onChange={(e) => setProductData({ ...productData, sku: e.target.value })}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium text-gray-700",
                }}
              />
              <Input
                label="Stock Quantity"
                labelPlacement="outside"
                type="number"
                isDisabled={isFetching}
                placeholder="0"
                value={productData.stockQuantity}
                onChange={(e) => setProductData({ ...productData, stockQuantity: e.target.value })}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium text-gray-700",
                }}
              />
            </div>
          </div>

          {/* Product Variants */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Variants</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Variant Name"
                  labelPlacement="outside"
                  isDisabled={isFetching}
                  placeholder="e.g., Size, Color"
                  value={variantInput.name}
                  onChange={(e) => setVariantInput({ ...variantInput, name: e.target.value })}
                  classNames={{
                    input: "text-sm",
                    label: "text-sm font-medium text-gray-700",
                  }}
                />
                <Input
                  label="Options (comma-separated)"
                  labelPlacement="outside"
                  isDisabled={isFetching}
                  placeholder="e.g., Small, Medium, Large"
                  value={variantInput.options}
                  onChange={(e) => setVariantInput({ ...variantInput, options: e.target.value })}
                  classNames={{
                    input: "text-sm",
                    label: "text-sm font-medium text-gray-700",
                  }}
                />
              </div>

              <CustomButton 
                intent="ghost" 
                size="sm" 
                onPress={addVariant}
                startContent={<Plus className="w-4 h-4" />}
                tooltip="Add a new product variant"
              >
                Add Variant
              </CustomButton>

              {productData.variants.length > 0 && (
                <div className="space-y-2">
                  {productData.variants.map((variant, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{variant.name}:</span>
                        <span className="text-gray-600 ml-2">{variant.options.join(", ")}</span>
                      </div>
                      <button onClick={() => removeVariant(index)} className="text-red-500 hover:text-red-700 text-sm">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="lg:col-span-1 space-y-6">
          {/* Product Status */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-8">Product Status</h3>
            <div className="space-y-10">
              <Select
                label="Visibility"
                labelPlacement="outside"
                isDisabled={isFetching}
                placeholder="Select status"
                selectedKeys={[productData.status]}
                onSelectionChange={(keys) => setProductData({ ...productData, status: Array.from(keys)[0] })}
                classNames={{
                  label: "text-sm font-medium text-gray-700",
                }}
              >
                {visibilityOptions.map((option) => (
                  <SelectItem key={option}>{option}</SelectItem>
                ))}
              </Select>

              <Select
                label="Stock Status"
                labelPlacement="outside"
                placeholder="Select stock status"
                isDisabled={isFetching}
                selectedKeys={[productData.stockStatus]}
                onSelectionChange={(keys) => setProductData({ ...productData, stockStatus: Array.from(keys)[0] })}
                classNames={{
                  label: "text-sm font-medium text-gray-700 ",
                }}
              >
                {stockStatusOptions.map((option) => (
                  <SelectItem key={option}>{option}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {/* Organization */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-8">Organization</h3>
            <div className="space-y-10">
              <Select
                label="Collections"
                labelPlacement="outside"
                isDisabled={isFetching}
                selectionMode="multiple"
                placeholder="Select collections"
                selectedKeys={categories}
                onSelectionChange={handleCategoryChange}
                classNames={{
                  label: "text-sm font-medium text-gray-700",
                }}
              >
                {fetchingCollection.map((c) => (
                  <SelectItem key={c.title}>{c.title}</SelectItem>
                ))}
              </Select>

              <Select
                label="Product Label"
                labelPlacement="outside"
                placeholder="Select label"
                isDisabled={isFetching}
                selectedKeys={[productData.productLabel]}
                onSelectionChange={(keys) => setProductData({ ...productData, productLabel: Array.from(keys)[0] })}
                classNames={{
                  label: "text-sm font-medium text-gray-700",
                }}
              >
                {productLabelOptions.map((label) => (
                  <SelectItem key={label}>{label}</SelectItem>
                ))}
              </Select>

              <Select
                label="Star Rating"
                labelPlacement="outside"
                placeholder="Select rating"
                isDisabled={isFetching}
                selectedKeys={productData.rating ? [productData.rating.toString()] : []}
                onSelectionChange={(keys) => setProductData({ ...productData, rating: Array.from(keys)[0] })}
                classNames={{
                  label: "text-sm font-medium text-gray-700",
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <SelectItem key={star.toString()}>{star} Star{star > 1 ? "s" : ""}</SelectItem>
                ))}
              </Select>

              <Input
                label="Limited Time Deal (End Date & Time)"
                labelPlacement="outside"
                type="datetime-local"
                isDisabled={isFetching}
                placeholder="Select end date and time"
                value={productData.limitedTimeDeal}
                onChange={(e) => setProductData({ ...productData, limitedTimeDeal: e.target.value })}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium text-gray-700",
                }}
                description="Set the deadline for limited time deals"
              />

              <Input
                label="Tags"
                labelPlacement="outside"
                isDisabled={isFetching}
                placeholder="e.g. electronics, smart"
                value={productData.tags}
                onChange={(e) => setProductData({ ...productData, tags: e.target.value })}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium text-gray-700",
                }}
              />

              <Input
                label="Supplier"
                labelPlacement="outside"
                isDisabled={isFetching}
                placeholder="Enter supplier name"
                value={productData.supplier}
                onChange={(e) => setProductData({ ...productData, supplier: e.target.value })}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium text-gray-700",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Loading product editor...</p>
          </div>
        </div>
      }
    >
      <ProductForm />
    </Suspense>
  );
}
