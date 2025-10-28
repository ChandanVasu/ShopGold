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
  const [fetchError, setFetchError] = useState("");
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');

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

  // Create a localStorage key based on whether it's an update or new post
  const getStorageKey = () => {
    return isUpdate && postId ? `postDraft_edit_${postId}` : 'postDraft_new';
  };

  // Save form data to localStorage whenever postData changes
  useEffect(() => {
    if (postData.title || postData.content || postData.shortDescription) {
      localStorage.setItem(getStorageKey(), JSON.stringify({
        postData,
        selectedImages,
        timestamp: Date.now()
      }));
      
      setAutoSaveStatus('Saved');
      const timer = setTimeout(() => setAutoSaveStatus(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [postData, selectedImages, isUpdate, postId]);

  // Load draft from localStorage on component mount
  useEffect(() => {
    const loadDraft = () => {
      try {
        const savedDraft = localStorage.getItem(getStorageKey());
        if (savedDraft) {
          const { postData: savedPostData, selectedImages: savedImages, timestamp } = JSON.parse(savedDraft);
          
          // Only load draft if it's less than 24 hours old
          const hoursSinceSaved = (Date.now() - timestamp) / (1000 * 60 * 60);
          if (hoursSinceSaved < 24) {
            setPostData(savedPostData);
            setSelectedImages(savedImages || []);
            setIsDraftLoaded(true);
          } else {
            // Remove old draft
            localStorage.removeItem(getStorageKey());
          }
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    };

    // Only load draft if we're not updating an existing post or if the update fetch failed
    if (!isUpdate || !postId) {
      loadDraft();
    }
  }, [isUpdate, postId]);

  const statusOptions = ["Published", "Draft", "Archived"];
  const categories = ["Blog", "Page"];

  // Reset form when postId changes
  useEffect(() => {
    if (postId) {
      setPostData({
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
      setSelectedImages([]);
      setFetchError("");
    }
  }, [postId]);

  useEffect(() => {
    const fetchPostById = async () => {
      if (!isUpdate || !postId) return;

      try {
        console.log("🔍 Fetching post with ID:", postId); // Debug log
        
        // Try different API approaches to ensure we get the right post
        const res = await fetch(`/api/data?collection=Posts`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }
        
        const allPosts = await res.json();
        console.log("📋 All posts fetched:", allPosts.length, "posts");
        
        // Find the specific post by ID
        const data = allPosts.find(post => post._id === postId);
        
        console.log("📄 Found post data:", data); // Debug log
        console.log("🎯 Requested ID:", postId, "Found ID:", data?._id); // ID comparison

        if (!data) {
          setFetchError(`Post with ID ${postId} not found in ${allPosts.length} posts`);
          return;
        }

        if (data._id !== postId) {
          setFetchError(`ID mismatch: Requested ${postId}, got ${data._id}`);
          return;
        }

        // Check if there's a newer draft in localStorage
        const savedDraft = localStorage.getItem(getStorageKey());
        let shouldUseDraft = false;
        
        if (savedDraft) {
          try {
            const { timestamp } = JSON.parse(savedDraft);
            const draftAge = (Date.now() - timestamp) / (1000 * 60); // in minutes
            
            // If draft is less than 30 minutes old, automatically use the draft
            if (draftAge < 30) {
              shouldUseDraft = true;
              setIsDraftLoaded(true);
            }
          } catch (e) {
            console.error("Error parsing saved draft:", e);
          }
        }

        if (!shouldUseDraft) {
          // Load the original post data and clear any existing draft
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
          
          // Clear the old draft since we're loading fresh data
          localStorage.removeItem(getStorageKey());
        }
        // If shouldUseDraft is true, the useEffect for loading draft will handle it

        setFetchError("");
      } catch (err) {
        console.error("❌ Failed to fetch post:", err);
        setFetchError(`Error: ${err.message}`);
        
        // Don't clear existing data if fetch fails - user might have unsaved changes
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

      // Clear the draft after successful save
      localStorage.removeItem(getStorageKey());
      setIsDraftLoaded(false);

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
        <div>
          <h1 className="text-2xl font-bold">{isUpdate ? "Update Post" : "Add New Post"}</h1>
          {isUpdate && postId && (
            <p className="text-sm text-gray-600 mt-1">
              Editing Post ID: {postId} | Title: "{postData.title || 'Loading...'}"
            </p>
          )}
          {isDraftLoaded && (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
                📝 Auto-restored from recent draft - Your changes are auto-saved
              </p>
              <button
                onClick={() => {
                  localStorage.removeItem(getStorageKey());
                  setIsDraftLoaded(false);
                  window.location.reload();
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Reload Original
              </button>
            </div>
          )}
          {fetchError && (
            <p className="text-sm text-red-600 mt-1 bg-red-50 px-3 py-2 rounded-md">
              ⚠️ {fetchError}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {autoSaveStatus && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              ✓ {autoSaveStatus}
            </span>
          )}
          <CustomButton isLoading={addLoading} onPress={handlePostSave} className="bg-black text-white" size="sm">
            {isUpdate ? "Update Post" : "Publish Post"}
          </CustomButton>
        </div>
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
                slug: slugify(newTitle),
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
