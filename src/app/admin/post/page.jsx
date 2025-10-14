"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, User, Pagination, Spinner } from "@heroui/react";
import { MdDelete } from "react-icons/md";
import { RiEditCircleFill } from "react-icons/ri";
import Empty from "@/components/block/Empty";
import DeleteConfirmationModal from "@/components/block/DeleteConfirmationModal";
import formatDate from "@/utils/formatDate";
import CustomButton from "@/components/block/CustomButton";

export default function PostTablePage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(posts.length / rowsPerPage);
  const paginatedPosts = posts.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/data?collection=Posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPost) return;
    try {
      const res = await fetch("/api/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: selectedPost, collection: "Posts" }),
      });
      if (res.ok) {
        setPosts(posts.filter((p) => p._id !== selectedPost));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteModalOpen(false);
      setSelectedPost(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-45px)]">
        <Spinner color="secondary" size="lg" />
      </div>
    );
  }

  return (
    <div className="px-5 py-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Posts</h1>
          <p className="text-sm text-gray-600">Manage and organize all your published and draft blog posts.</p>
        </div>
        <CustomButton as={Link} href="/admin/post/new" size="sm" className="bg-black text-white">
          New Post
        </CustomButton>
      </div>

      {posts.length === 0 ? (
        <Empty title="No Posts Found" description="You haven't written any posts yet. Start writing to see them here." />
      ) : (
        <div className="overflow-auto">
          <Table
            shadow="none"
            aria-label="Post Table"
            bottomContent={
              posts.length > rowsPerPage && (
                <div className="w-full flex justify-center mt-4 sticky bottom-0 bg-white py-2 z-10">
                  <Pagination isCompact showControls showShadow color="secondary" page={page} total={totalPages} onChange={setPage} />
                </div>
              )
            }
          >
            <TableHeader>
              <TableColumn>Post</TableColumn>
              <TableColumn>Date</TableColumn>
              <TableColumn>Last Update</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedPosts.map((post) => (
                <TableRow key={post._id}>
                  <TableCell>
                    <User
                      avatarProps={{
                        src: post.images?.[0] || "",
                        name: post.title,
                        size: "md",
                      }}
                      name={post.title}
                      description={post.content ? post.content.replace(/<[^>]+>/g, "").slice(0, 40) + "..." : "No content"}
                    />
                  </TableCell>
                  <TableCell>{formatDate(post.createdAt)}</TableCell>
                  <TableCell>{formatDate(post.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <div
                        className="bg-red-100 p-2 rounded-md cursor-pointer hover:bg-red-200"
                        onClick={() => {
                          setSelectedPost(post._id);
                          setDeleteModalOpen(true);
                        }}
                      >
                        <MdDelete className="text-red-600 text-lg" />
                      </div>
                      <Link
                        href={{
                          pathname: "/admin/post/new",
                          query: { postId: post._id, isUpdate: true },
                        }}
                      >
                        <div className="bg-blue-100 p-2 rounded-md cursor-pointer hover:bg-blue-200">
                          <RiEditCircleFill className="text-blue-600 text-lg" />
                        </div>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DeleteConfirmationModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDelete} />
    </div>
  );
}
