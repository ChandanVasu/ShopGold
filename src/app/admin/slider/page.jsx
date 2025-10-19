"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Input, Spinner, Pagination, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, User } from "@heroui/react";
import { MdDelete } from "react-icons/md";
import { RiEditCircleFill } from "react-icons/ri";
import SingleImageSelect from "@/components/block/ImageSelector";
import DeleteConfirmationModal from "@/components/block/DeleteConfirmationModal";
import Empty from "@/components/block/Empty";
import CustomButton from "@/components/block/CustomButton";

const COLLECTION = "slider-image";
const TOP_OFFER_COLLECTION = "top-offer-banner";

export default function SliderImagePage() {
  const [sliderImages, setSliderImages] = useState([]);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [url, setUrl] = useState("");

  // Top Offer Banner state
  const [topOfferBanner, setTopOfferBanner] = useState(null);
  const [topOfferImage, setTopOfferImage] = useState("");
  const [topOfferUrl, setTopOfferUrl] = useState("");
  const [topOfferLoading, setTopOfferLoading] = useState(false);
  const [topOfferModalOpen, setTopOfferModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;

  const fetchSliderImages = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/data?collection=${COLLECTION}`);
      const data = await res.json();
      if (res.ok) {
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setSliderImages(sorted);
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchTopOfferBanner = async () => {
    try {
      const res = await fetch(`/api/data?collection=${TOP_OFFER_COLLECTION}`);
      const data = await res.json();
      if (res.ok && data.length > 0) {
        const banner = data[0];
        setTopOfferBanner(banner);
        setTopOfferImage(banner.image || "");
        setTopOfferUrl(banner.url || "");
      }
    } catch (err) {
      console.error("Failed to fetch top offer banner", err);
    }
  };

  useEffect(() => {
    fetchSliderImages();
    fetchTopOfferBanner();
  }, []);

  const createOrUpdateImage = async () => {
    if (!title || !image || !url) {
      setTitleError(!title);
      setUrlError(!url);
      return;
    }

    setLoading(true);
    try {
      const method = selectedId ? "PUT" : "POST";
      const payload = {
        collection: COLLECTION,
        _id: selectedId,
        title,
        image,
        url,
      };

      const res = await fetch("/api/data", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        resetForm();
        fetchSliderImages();
      } else {
        console.error("Save failed", data);
        alert("Failed to save image.");
      }
    } catch (err) {
      console.error("Error saving", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: COLLECTION, _id: selectedId }),
      });

      const data = await res.json();
      if (res.ok) {
        fetchSliderImages();
        resetForm();
      } else {
        console.error("Delete failed", data);
      }
    } catch (err) {
      console.error("Error deleting", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setImage("");
    setUrl("");
    setSelectedId(null);
    setDeleteModalOpen(false);
  };

  const saveTopOfferBanner = async () => {
    if (!topOfferImage) {
      alert("Please select an image for the top offer banner");
      return;
    }

    setTopOfferLoading(true);
    try {
      const method = topOfferBanner?._id ? "PUT" : "POST";
      const payload = {
        collection: TOP_OFFER_COLLECTION,
        _id: topOfferBanner?._id,
        title: "Top Offer Banner",
        image: topOfferImage,
        url: topOfferUrl || "#",
      };

      const res = await fetch("/api/data", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Top offer banner saved successfully!");
        fetchTopOfferBanner();
      } else {
        alert("Failed to save top offer banner");
      }
    } catch (err) {
      console.error("Error saving top offer banner", err);
      alert("Error saving top offer banner");
    } finally {
      setTopOfferLoading(false);
    }
  };

  const deleteTopOfferBanner = async () => {
    if (!topOfferBanner?._id) return;
    
    setTopOfferLoading(true);
    try {
      const res = await fetch("/api/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: TOP_OFFER_COLLECTION, _id: topOfferBanner._id }),
      });

      if (res.ok) {
        setTopOfferBanner(null);
        setTopOfferImage("");
        setTopOfferUrl("");
        alert("Top offer banner deleted successfully!");
      }
    } catch (err) {
      console.error("Error deleting top offer banner", err);
    } finally {
      setTopOfferLoading(false);
    }
  };

  const pages = Math.ceil(sliderImages.length / rowsPerPage);
  const currentPageData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sliderImages.slice(start, start + rowsPerPage);
  }, [page, sliderImages]);

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <div className="text-center">
          <Spinner color="secondary" variant="gradient" size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Slider & Banner Management</h1>
          <p className="text-sm text-gray-600">Manage your home page slider images and top offer banner.</p>
        </div>
      </div>

      {/* Top Offer Banner Section */}
      <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">🎯</span> Top Offer Banner
        </h2>
        <p className="text-sm text-gray-600 mb-4">This banner appears at the very top of your homepage</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-4">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs font-semibold text-orange-900 mb-1">📐 Recommended Size:</p>
              <ul className="text-xs text-orange-800 space-y-0.5">
                <li>• Full Width Banner</li>
                <li>• Desktop: <strong>1920x80px</strong></li>
                <li>• Mobile: <strong>800x80px</strong></li>
              </ul>
            </div>

            <Input
              label="Redirect URL (Optional)"
              placeholder="https://example.com/offer"
              size="sm"
              value={topOfferUrl}
              labelPlacement="outside"
              onChange={(e) => setTopOfferUrl(e.target.value)}
            />

            <div
              onClick={() => setTopOfferModalOpen(true)}
              className={`flex justify-center items-center border-2 border-dashed rounded-md cursor-pointer hover:border-orange-400 transition-colors ${
                !topOfferImage ? "h-[100px]" : ""
              }`}
              style={{ backgroundColor: topOfferImage ? "transparent" : "#fff8f0" }}
            >
              {topOfferImage ? (
                <div className="relative w-full group">
                  <img src={topOfferImage} alt="top offer" className="w-full h-[100px] object-cover rounded-md" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-md flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">Click to change</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <span className="text-orange-600 font-medium">Click to select banner image</span>
                  <p className="text-xs text-gray-500 mt-1">Full width banner for top of homepage</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <CustomButton
                size="sm"
                className="flex-1 bg-orange-500 text-white"
                onPress={saveTopOfferBanner}
                isLoading={topOfferLoading}
              >
                {topOfferBanner?._id ? "Update Banner" : "Save Banner"}
              </CustomButton>
              {topOfferBanner?._id && (
                <CustomButton
                  size="sm"
                  className="bg-red-500 text-white"
                  onPress={deleteTopOfferBanner}
                  isLoading={topOfferLoading}
                >
                  Delete
                </CustomButton>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Preview:</label>
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {topOfferImage ? (
                <img src={topOfferImage} alt="preview" className="w-full h-[100px] object-cover" />
              ) : (
                <div className="w-full h-[100px] flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p className="text-sm">No banner selected</p>
                    <p className="text-xs mt-1">Your top offer banner will appear here</p>
                  </div>
                </div>
              )}
            </div>
            {topOfferImage && (
              <div className="text-xs text-gray-600 bg-green-50 border border-green-200 rounded p-2">
                ✅ Banner is active and will show on homepage
              </div>
            )}
          </div>
        </div>
      </div>

      <SingleImageSelect
        isOpen={topOfferModalOpen}
        onClose={() => setTopOfferModalOpen(false)}
        onSelectImages={(url) => setTopOfferImage(url)}
        selectType="single"
      />

      {/* Divider */}
      <div className="border-t border-gray-300 my-8"></div>

      {/* Main Slider Images Section */}
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">🎞️</span> Main Slider Images
      </h2>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Form */}
        <div className="w-full md:w-1/3 bg-white p-4 rounded-lg h-min">
          <h2 className="text-lg font-semibold mb-3">{selectedId ? "Edit Image" : "Add New Image"}</h2>
          
          {/* Recommended Size Info */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-1">📐 Recommended Banner Size:</p>
            <ul className="text-xs text-blue-800 space-y-0.5">
              <li>• Desktop: <strong>1920x500px</strong></li>
              <li>• Mobile: <strong>800x300px</strong></li>
              <li>• Aspect Ratio: <strong>16:9 or 21:9</strong></li>
              <li className="text-blue-600 mt-1">Images auto-adjust to fit the slider</li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <Input
              label="Image Title"
              placeholder="Enter title"
              size="sm"
              value={title}
              labelPlacement="outside"
              isInvalid={titleError}
              errorMessage={titleError ? "Title is required" : ""}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(false);
              }}
            />
            <Input
              label="Redirect URL"
              placeholder="https://example.com"
              size="sm"
              value={url}
              labelPlacement="outside"
              isInvalid={urlError}
              errorMessage={urlError ? "URL is required" : ""}
              onChange={(e) => {
                setUrl(e.target.value);
                if (urlError) setUrlError(false);
              }}
            />
            <div
              onClick={() => setModalOpen(true)}
              className={`flex justify-center items-center border-2 border-dashed rounded-md cursor-pointer ${!image ? "h-[200px]" : ""}`}
              style={{ backgroundColor: image ? "transparent" : "#f9f9f9" }}
            >
              {image ? (
                <img src={image} alt="slider" className="w-full h-[200px] object-fill rounded-md" />
              ) : (
                <span className="text-gray-400">Click to select an image</span>
              )}
            </div>
            <CustomButton size="sm" className="bg-black text-white" onPress={createOrUpdateImage} isLoading={loading}>
              {loading ? (selectedId ? "Updating..." : "Creating...") : selectedId ? "Update" : "Create"}
            </CustomButton>
          </div>
        </div>

        <SingleImageSelect isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSelectImages={(url) => setImage(url)} selectType="single" />

        {/* Table */}
        <div className="w-full md:w-2/3">
          <h2 className="text-lg font-semibold mb-3">Image List</h2>
          {sliderImages.length === 0 ? (
            <Empty title="No Slider Images" description="Add new images to appear in your slider." />
          ) : (
            <Table aria-label="Slider Image Table" shadow="none">
              <TableHeader>
                <TableColumn>Image</TableColumn>
                <TableColumn>Created At</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {currentPageData.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <User
                        avatarProps={{
                          src: item.image,
                          name: item.title,
                        }}
                        name={item.title}
                      />
                    </TableCell>
                    <TableCell>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-between items-center w-[80px]">
                        <span
                          className="p-2 bg-blue-100 hover:bg-blue-200 rounded-md cursor-pointer"
                          onClick={() => {
                            setTitle(item.title);
                            setImage(item.image);
                            setUrl(item.url || "");
                            setSelectedId(item._id);
                          }}
                        >
                          <RiEditCircleFill className="text-blue-500 text-lg" />
                        </span>
                        <span
                          className="p-2 bg-red-100 hover:bg-red-200 rounded-md cursor-pointer"
                          onClick={() => {
                            setSelectedId(item._id);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <MdDelete className="text-red-600 text-lg" />
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {sliderImages.length > rowsPerPage && (
            <div className="flex justify-center mt-4">
              <Pagination isCompact showControls showShadow color="secondary" page={page} total={pages} onChange={setPage} />
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={deleteImage} />
    </div>
  );
}
