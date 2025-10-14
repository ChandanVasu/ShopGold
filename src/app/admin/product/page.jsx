"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, User, Pagination } from "@heroui/react";
import { Trash2, Edit3, Package, Plus } from "lucide-react";
import Empty from "@/components/block/Empty";
import DeleteConfirmationModal from "@/components/block/DeleteConfirmationModal";
import formatDate from "@/utils/formatDate";
import { Spinner } from "@heroui/react";
import CustomButton from "@/components/block/CustomButton";

export default function ProductTablePage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(products.length / rowsPerPage);
  const paginatedProducts = products.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/product");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      const res = await fetch("/api/product", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: selectedProduct }),
      });
      if (res.ok) {
        setProducts(products.filter((p) => p._id !== selectedProduct));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <div className="text-center">
          <Spinner color="secondary" variant="gradient" size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 md:p-6 space-y-6">
      {/* Simple Header */}
      <div className="flex flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 text-sm mt-1">
            {products.length} {products.length === 1 ? "product" : "products"} in store
          </p>
        </div>
        <CustomButton 
          as={Link} 
          href="/admin/product/new"
          intent="primary"
          size="sm"
          startContent={<Plus className="w-4 h-4" />}
          tooltip="Create a new product"
        >
          Add Product
        </CustomButton>
      </div>

      {/* Products Content */}
      <div className="bg-white rounded-xl overflow-hidden">
        {products.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-4 text-sm">Get started by adding your first product to the store.</p>
            <CustomButton
              as={Link}
              href="/admin/product/new"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Product
            </CustomButton>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Mobile Cards View */}
            <div className="block lg:hidden">
              <div className="p-4">
                <div className="space-y-3">
                  {paginatedProducts.map((product) => (
                    <div key={product._id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <img src={product.images?.[0] || "/placeholder-product.png"} alt={product.title} className="w-12 h-12 rounded-lg object-cover bg-gray-200" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">{product.title}</h4>
                          <p className="text-gray-600 text-xs mb-2 line-clamp-2">{product.description ? product.description.replace(/<[^>]+>/g, "").slice(0, 60) + "..." : "No description"}</p>
                          <p className="text-xs text-gray-500">{formatDate(product.createdAt)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            onClick={() => {
                              setSelectedProduct(product._id);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <Link
                            href={{
                              pathname: "/admin/product/new",
                              query: { productId: product._id, isUpdate: true },
                            }}
                          >
                            <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Table
                shadow="none"
                aria-label="Product Table"
                classNames={{
                  wrapper: "shadow-none border-none rounded-none",
                  th: "bg-gray-50 text-gray-700 font-medium py-3",
                  td: "py-3 ",
                }}
                bottomContent={
                  products.length > rowsPerPage ? (
                    <div className="w-full flex justify-center p-4 border-t border-gray-200">
                      <Pagination isCompact showControls color="primary" page={page} total={totalPages} onChange={(page) => setPage(page)} />
                    </div>
                  ) : null
                }
              >
                <TableHeader>
                  <TableColumn>Product</TableColumn>
                  <TableColumn className="hidden md:table-cell">Date</TableColumn>
                  <TableColumn className="hidden xl:table-cell">Last Update</TableColumn>
                  <TableColumn className="text-center">Actions</TableColumn>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product._id} className="hover:bg-gray-50">
                      <TableCell>
                        <User
                          avatarProps={{
                            src: product.images?.[0] || "/placeholder-product.png",
                            name: product.title,
                            size: "md",
                            className: "rounded-lg",
                          }}
                          name={<span className="font-medium text-gray-900">{product.title}</span>}
                          description={
                            <span className="text-gray-600 text-sm line-clamp-1 md:line-clamp-2">{product.description ? product.description.replace(/<[^>]+>/g, "").slice(0, 50) + "..." : "No description"}</span>
                          }
                        />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-gray-600 text-sm">{formatDate(product.createdAt)}</TableCell>
                      <TableCell className="hidden xl:table-cell text-gray-600 text-sm">{formatDate(product.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <button
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            onClick={() => {
                              setSelectedProduct(product._id);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <Link
                            href={{
                              pathname: "/admin/product/new",
                              query: { productId: product._id, isUpdate: true },
                            }}
                          >
                            <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Pagination */}
            {products.length > rowsPerPage && (
              <div className="block lg:hidden p-4 border-t border-gray-200">
                <Pagination isCompact showControls color="primary" page={page} total={totalPages} onChange={(page) => setPage(page)} className="flex justify-center" />
              </div>
            )}
          </div>
        )}
      </div>

      <DeleteConfirmationModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDelete} />
    </div>
  );
}
