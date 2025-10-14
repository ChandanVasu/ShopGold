"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Input, Spinner, Pagination, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, User } from "@heroui/react";
import { MdDelete } from "react-icons/md";
import { RiEditCircleFill } from "react-icons/ri";
import SingleImageSelect from "@/components/block/ImageSelector";
import DeleteConfirmationModal from "@/components/block/DeleteConfirmationModal";
import Empty from "@/components/block/Empty";
import CustomButton from "@/components/block/CustomButton";

export default function Page() {
  const [collection, setCollection] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [featuredImage, setFeaturedImage] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [titleError, setTitleError] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;

  const fetchCollection = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(`/api/collection`, {
        cache: "reload",
      });
      const data = await response.json();
      if (response.ok) {
        setCollection(data);
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

  const createCollection = async () => {
    setLoading(true);
    if (!title) {
      setTitleError(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/collection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, image: featuredImage }),
      });

      const data = await response.json();
      if (response.ok) {
        setTitle("");
        setDescription("");
        setFeaturedImage("");
        fetchCollection();
      } else {
        console.error("Failed to create collection:", data);
      }
    } catch (error) {
      console.error("Error creating collection:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCollection = async () => {
    if (!selectedCollectionId || !title) {
      setTitleError(!title);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/collection`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: selectedCollectionId,
          title,
          description,
          image: featuredImage,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTitle("");
        setDescription("");
        setFeaturedImage("");
        setSelectedCollectionId(null);
        fetchCollection();
      } else {
        console.error("Failed to update collection:", data);
      }
    } catch (error) {
      console.error("Error updating collection:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async () => {
    if (!selectedCollectionId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/collection`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: selectedCollectionId }),
      });

      const data = await response.json();
      if (response.ok) {
        fetchCollection();
        setDeleteModalOpen(false);
        setSelectedCollectionId(null);
      } else {
        console.error("Failed to delete collection:", data);
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
    } finally {
      setLoading(false);
    }
  };

  const pages = Math.ceil(collection.length / rowsPerPage);
  const currentCollection = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return collection.slice(start, start + rowsPerPage);
  }, [page, collection]);

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
          <h1 className="text-2xl font-bold">Collection</h1>
          <p className="text-sm text-gray-600">Manage your collection of products.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Form Section */}
        <div className="w-full md:w-1/3 bg-white p-4 rounded-lg h-min">
          <h2 className="text-lg font-semibold mb-3">{selectedCollectionId ? "Edit Collection" : "Add New Collection"}</h2>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Enter collection title"
              value={title}
              size="sm"
              label="Collection Title"
              isrequired
              labelPlacement="outside"
              description="This will be the title of your collection."
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(false);
              }}
              isInvalid={titleError}
              errorMessage={titleError ? "Title is required" : ""}
            />
            <Input
              placeholder="Enter collection description"
              size="sm"
              value={description}
              label="Collection Description"
              labelPlacement="outside"
              description="Provide a description for your collection."
              onChange={(e) => setDescription(e.target.value)}
            />
            <div
              onClick={() => setModalOpen(true)}
              className={`flex justify-center items-center border-2 border-dashed rounded-md cursor-pointer ${!featuredImage ? "h-[200px]" : ""}`}
              style={{
                backgroundColor: featuredImage ? "transparent" : "#f9f9f9",
              }}
            >
              {featuredImage ? <img src={featuredImage} alt="Featured" className="w-full h-[200px] object-fill rounded-md" /> : <span className="text-gray-400">Click to select an image</span>}
            </div>
            <CustomButton size="sm" className="bg-black text-white" onPress={selectedCollectionId ? updateCollection : createCollection} isLoading={loading}>
              {loading ? (selectedCollectionId ? "Updating..." : "Creating...") : selectedCollectionId ? "Update" : "Create"}
            </CustomButton>
          </div>
        </div>

        {/* Image Selector Modal */}
        <SingleImageSelect isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSelectImages={(urls) => setFeaturedImage(urls)} selectType="single" />

        {/* Collection Table Section */}
        <div className="w-full md:w-2/3">
          <h2 className="text-lg font-semibold mb-3">Collection List</h2>
          {collection.length === 0 ? (
            <Empty title="No Collections Found" description="Please create a new collection to get started." />
          ) : (
            <Table shadow="none" aria-label="Collection Table">
              <TableHeader>
                <TableColumn>Collection</TableColumn>
                <TableColumn>Created At</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {currentCollection.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <User
                        avatarProps={{
                          src: item.image || undefined,
                          name: item.title,
                        }}
                        name={item.title}
                        description={item.description || "No description"}
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
                            setDescription(item.description);
                            setFeaturedImage(item.image);
                            setSelectedCollectionId(item._id);
                          }}
                        >
                          <RiEditCircleFill className="text-blue-500 text-lg" />
                        </span>
                        <span
                          className="p-2 bg-red-100 hover:bg-red-200 rounded-md cursor-pointer"
                          onClick={() => {
                            setTitle("");
                            setDescription("");
                            setFeaturedImage("");
                            setSelectedCollectionId(item._id);
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
          {collection.length > rowsPerPage && (
            <div className="flex justify-center mt-4">
              <Pagination isCompact showControls showShadow color="secondary" page={page} total={pages} onChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={deleteCollection} />
    </div>
  );
}
