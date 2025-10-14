"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Input, Spinner, Pagination, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { MdDelete } from "react-icons/md";
import { RiEditCircleFill } from "react-icons/ri";
import DeleteConfirmationModal from "@/components/block/DeleteConfirmationModal";
import Empty from "@/components/block/Empty";
import CustomButton from "@/components/block/CustomButton";

const COLLECTION = "video-reels";

const getYoutubeId = (url) => {
  try {
    const u = new URL(url);
    if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/shorts/")[1];
    if (u.searchParams.has("v")) return u.searchParams.get("v");
    if (u.pathname.startsWith("/embed/")) return u.pathname.split("/embed/")[1];
    return null;
  } catch {
    return null;
  }
};

export default function ReelManagementPage() {
  const [reels, setReels] = useState([]);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 6;

  const [error, setError] = useState({
    name: false,
    comment: false,
    videoUrl: false,
  });

  const fetchReels = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/data?collection=${COLLECTION}`);
      const data = await res.json();
      if (res.ok) {
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReels(sorted);
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const createOrUpdateReel = async () => {
    const newError = {
      name: !name,
      comment: !comment,
      videoUrl: !videoUrl,
    };
    setError(newError);
    if (Object.values(newError).some(Boolean)) return;

    setLoading(true);
    try {
      const method = selectedId ? "PUT" : "POST";
      const payload = {
        collection: COLLECTION,
        _id: selectedId,
        name,
        comment,
        videoUrl,
      };

      const res = await fetch("/api/data", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        fetchReels();
      } else {
        alert("Failed to save video reel.");
      }
    } catch (err) {
      console.error("Error saving", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteReel = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: COLLECTION, _id: selectedId }),
      });
      if (res.ok) {
        fetchReels();
        resetForm();
      } else {
        alert("Failed to delete");
      }
    } catch (err) {
      console.error("Delete error", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setComment("");
    setVideoUrl("");
    setSelectedId(null);
    setDeleteModalOpen(false);
    setError({ name: false, comment: false, videoUrl: false });
  };

  const pages = Math.ceil(reels.length / rowsPerPage);
  const currentPageData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return reels.slice(start, start + rowsPerPage);
  }, [page, reels]);

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
          <h1 className="text-2xl font-bold">Customer Reels</h1>
          <p className="text-sm text-gray-600">Manage your customer testimonial reels.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Form */}
        <div className="w-full md:w-1/3 bg-white p-4 rounded-lg h-min">
          <h2 className="text-lg font-semibold mb-3">{selectedId ? "Edit Reel" : "Add New Reel"}</h2>
          <div className="flex flex-col gap-4">
            <Input
              label="Name"
              placeholder="Customer Name"
              size="sm"
              value={name}
              labelPlacement="outside"
              isInvalid={error.name}
              errorMessage={error.name ? "Name is required" : ""}
              onChange={(e) => {
                setName(e.target.value);
                if (error.name) setError((prev) => ({ ...prev, name: false }));
              }}
            />
            <Input
              label="Comment"
              placeholder="Customer comment"
              size="sm"
              value={comment}
              labelPlacement="outside"
              isInvalid={error.comment}
              errorMessage={error.comment ? "Comment is required" : ""}
              onChange={(e) => {
                setComment(e.target.value);
                if (error.comment) setError((prev) => ({ ...prev, comment: false }));
              }}
            />
            <Input
              label="YouTube Video URL"
              placeholder="https://youtube.com/shorts/..."
              size="sm"
              value={videoUrl}
              labelPlacement="outside"
              isInvalid={error.videoUrl}
              errorMessage={error.videoUrl ? "Video URL is required" : ""}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                if (error.videoUrl) setError((prev) => ({ ...prev, videoUrl: false }));
              }}
            />
            <CustomButton size="sm" className="bg-black text-white" onPress={createOrUpdateReel} isLoading={loading}>
              {loading ? (selectedId ? "Updating..." : "Creating...") : selectedId ? "Update" : "Create"}
            </CustomButton>
          </div>
        </div>

        {/* Table */}
        <div className="w-full md:w-2/3">
          <h2 className="text-lg font-semibold mb-3">Reel List</h2>
          {reels.length === 0 ? (
            <Empty title="No Reels Yet" description="Add video reels to show customer feedback." />
          ) : (
            <Table aria-label="Reel Table" shadow="none">
              <TableHeader>
                <TableColumn>Video</TableColumn>
                <TableColumn>Name</TableColumn>
                <TableColumn>Comment</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {currentPageData.map((item) => {
                  const videoId = getYoutubeId(item.videoUrl);
                  return (
                    <TableRow key={item._id}>
                      <TableCell>
                        <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt={item.name} className="w-[100px] h-[60px] object-cover rounded-md" />
                      </TableCell>

                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <div className="line-clamp-1 max-w-[180px]">{item.comment}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-between items-center w-[80px]">
                          <span
                            className="p-2 bg-blue-100 hover:bg-blue-200 rounded-md cursor-pointer"
                            onClick={() => {
                              setName(item.name);
                              setComment(item.comment);
                              setVideoUrl(item.videoUrl);
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
                  );
                })}
              </TableBody>
            </Table>
          )}
          {reels.length > rowsPerPage && (
            <div className="flex justify-center mt-4">
              <Pagination isCompact showControls showShadow color="secondary" page={page} total={pages} onChange={setPage} />
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={deleteReel} />
    </div>
  );
}
