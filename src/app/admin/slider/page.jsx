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

export default function SliderImagePage() {
  const [sliderImages, setSliderImages] = useState([]);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [url, setUrl] = useState("");

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

  useEffect(() => {
    fetchSliderImages();
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
          <h1 className="text-2xl font-bold">Slider Images</h1>
          <p className="text-sm text-gray-600">Manage your home page slider images.</p>
        </div>
      </div>

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
