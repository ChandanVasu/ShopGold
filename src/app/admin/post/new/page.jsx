"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Input, Select, SelectItem, Textarea } from "@heroui/react";
import CustomButton from "@/components/block/CustomButton";
import ImageSelector from "@/components/block/ImageSelector";
import { FaPlus } from "react-icons/fa";

// Dynamically import the text editor
const TextEditor = dynamic(() => import("@/components/block/TextEditor"), { ssr: false });

// Utility to create a slug from text
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");

function PostForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const postId = searchParams?.get("postId") || "";
  const isUpdate = searchParams?.get("isUpdate") === "true";

  const [addLoading, setAddLoading] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSlugEdited, setIsSlugEdited] = useState(false); // Track if user manually changed slug

  const [postData, setPostData] = useState({
    title: "",
    content: "",
    shortDescription: "",
    tags: "",
    author: "",
    status: "Published",
    slug: "",
    seoTitle: "",
    seoDescription: "",
    category: "",
  });

  const statusOptions = ["Published", "Draft", "Archived"];
  const categories = ["Blog", "Page"];

  useEffect(() => {
    const fetchPostById = async () => {
      if (!isUpdate || !postId) return;

      try {
        const res = await fetch(`/api/data?collection=Posts&id=${postId}`);
        const dataRes = await res.json();
        const data = dataRes?.[0] || {};

        setPostData({
          title: data.title || "",
          content: data.content || "",
          shortDescription: data.shortDescription || "",
          tags: data.tags || "",
          author: data.author || "",
          status: data.status || "Published",
          slug: data.slug || "",
          seoTitle: data.seoTitle || "",
          seoDescription: data.seoDescription || "",
          category: data.category || "",
        });

        setSelectedImages(data.images || []);
      } catch (err) {
        console.error("❌ Failed to fetch post:", err);
      }
    };

    fetchPostById();
  }, [isUpdate, postId]);

  const handlePostSave = async () => {
    setAddLoading(true);

    if (!postData.title) {
      setIsInvalid(true);
      setAddLoading(false);
      return;
    }

    try {
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch("/api/data", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isUpdate && { _id: postId }),
          ...postData,
          images: selectedImages,
          collection: "Posts",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ API Error:", error);
        throw new Error("Error saving post");
      }

      // Optional: toast or router
      // router.push("/admin/posts");
    } catch (err) {
      console.error("❌ Error saving post:", err);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isUpdate ? "Update Post" : "Add New Post"}</h1>
        <CustomButton isLoading={addLoading} onPress={handlePostSave} className="bg-black text-white" size="sm">
          {isUpdate ? "Update Post" : "Publish Post"}
        </CustomButton>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Panel */}
        <div className="flex-1 bg-white p-5 rounded-lg flex flex-col gap-5 sha-one">
          <Input
            label="Post Title"
            labelPlacement="outside"
            size="sm"
            placeholder="Enter post title"
            value={postData.title}
            isInvalid={isInvalid && !postData.title}
            errorMessage="Title is required"
            onChange={(e) => {
              const newTitle = e.target.value;
              setPostData((prev) => ({
                ...prev,
                title: newTitle,
                slug: isSlugEdited ? prev.slug : slugify(newTitle),
              }));
            }}
          />

          {/* Images */}
          <div>
            <h2 className="text-base font-medium mb-2">Cover Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              {selectedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img src={img} alt={`Selected ${index}`} className="w-full h-32 object-cover rounded-lg shadow-sm" />
                </div>
              ))}
              <div
                className="flex items-center justify-center w-full h-32 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:bg-gray-100"
                onClick={() => setIsImageSelectorOpen(true)}
              >
                <FaPlus className="text-gray-500" />
              </div>
            </div>
            <ImageSelector
              isOpen={isImageSelectorOpen}
              onClose={() => setIsImageSelectorOpen(false)}
              onSelectImages={(urls) => setSelectedImages(urls)}
              selectType="multiple"
            />
          </div>

          {/* Short Description */}
          <Textarea
            label="Short Description"
            labelPlacement="outside"
            placeholder="Enter a brief summary of the post"
            value={postData.shortDescription}
            onChange={(e) => setPostData({ ...postData, shortDescription: e.target.value })}
          />

          {/* Full Content */}
          <TextEditor value={postData.content} onChange={(value) => setPostData({ ...postData, content: value })} />
        </div>

        {/* Right Sidebar */}
        <div className="lg:w-[30%] w-full bg-white p-5 rounded-lg sha-one flex flex-col gap-5">
          <Select
            label="Post Status"
            labelPlacement="outside"
            placeholder="Select status"
            size="sm"
            selectedKeys={[postData.status]}
            onSelectionChange={(keys) => setPostData({ ...postData, status: Array.from(keys)[0] })}
          >
            {statusOptions.map((status) => (
              <SelectItem key={status}>{status}</SelectItem>
            ))}
          </Select>

          <Select
            label="Category"
            labelPlacement="outside"
            placeholder="Select category"
            size="sm"
            selectedKeys={[postData.category]}
            onSelectionChange={(keys) => setPostData({ ...postData, category: Array.from(keys)[0] })}
          >
            {categories.map((cat) => (
              <SelectItem key={cat}>{cat}</SelectItem>
            ))}
          </Select>

          {/* Slug Field (auto or manual) */}
          <Input
            label="Slug"
            labelPlacement="outside"
            size="sm"
            placeholder="post-title-slug"
            value={postData.slug}
            onChange={(e) => {
              setIsSlugEdited(true);
              setPostData({ ...postData, slug: e.target.value });
            }}
          />

          <Input
            label="Author"
            labelPlacement="outside"
            size="sm"
            placeholder="Author name"
            value={postData.author}
            onChange={(e) => setPostData({ ...postData, author: e.target.value })}
          />

          <Input
            label="Tags"
            labelPlacement="outside"
            size="sm"
            placeholder="e.g. ai, design"
            value={postData.tags}
            onChange={(e) => setPostData({ ...postData, tags: e.target.value })}
          />

          <Input
            label="SEO Title"
            labelPlacement="outside"
            size="sm"
            placeholder="Optimized title"
            value={postData.seoTitle}
            onChange={(e) => setPostData({ ...postData, seoTitle: e.target.value })}
          />

          <Input
            label="SEO Description"
            labelPlacement="outside"
            size="sm"
            placeholder="Meta description"
            value={postData.seoDescription}
            onChange={(e) => setPostData({ ...postData, seoDescription: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-lg">Loading post editor...</div>}>
      <PostForm />
    </Suspense>
  );
}
