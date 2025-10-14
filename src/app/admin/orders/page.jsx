"use client";

import { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Pagination, Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, Spinner, User } from "@heroui/react";
import { Eye, ShoppingBag, Package, X } from "lucide-react";
import CustomButton from "@/components/block/CustomButton";
import formatDate from "@/utils/formatDate";
import Empty from "@/components/block/Empty";

export default function OrderTablePage() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const totalPages = Math.ceil(orders.length / rowsPerPage);
  const paginatedOrders = orders.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/order");
      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
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
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 text-sm mt-1">
            {orders.length} {orders.length === 1 ? "order" : "orders"} from your customers
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-700">{orders.length} Total</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <ShoppingBag className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 text-sm">Once customers place orders, they will appear here for management.</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Mobile Cards View */}
            <div className="block lg:hidden">
              <div className="p-4">
                <div className="space-y-3">
                  {paginatedOrders.map((order) => (
                    <div key={order._id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{order.name}</h4>
                          <p className="text-gray-600 text-xs mb-1 truncate">{order.email}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-gray-900">
                            {order.paymentDetails?.currencySymbol}
                            {order.paymentDetails?.total}
                          </p>
                          <span
                            className={`inline-block px-2 py-1 rounded-lg text-xs font-medium mt-1 ${
                              order.paymentDetails?.paymentStatus === "succeeded" || order.paymentDetails?.paymentStatus === "paid"
                                ? "bg-green-100 text-green-700"
                                : order.paymentDetails?.paymentStatus === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {order.paymentDetails?.paymentStatus}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button onClick={() => handleView(order)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
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
                aria-label="Orders Table"
                classNames={{
                  wrapper: "shadow-none border-none rounded-none",
                  th: "bg-gray-50 text-gray-700 font-medium py-3",
                  td: "py-3",
                }}
                bottomContent={
                  orders.length > rowsPerPage ? (
                    <div className="w-full flex justify-center p-4 border-t border-gray-200">
                      <Pagination isCompact showControls color="primary" page={page} total={totalPages} onChange={(page) => setPage(page)} />
                    </div>
                  ) : null
                }
              >
                <TableHeader>
                  <TableColumn>Customer</TableColumn>
                  <TableColumn>Amount</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn className="hidden md:table-cell">Date</TableColumn>
                  <TableColumn className="text-center w-24">Actions</TableColumn>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => (
                    <TableRow key={order._id} className="hover:bg-gray-50">
                      <TableCell>
                        <User
                          name={<span className="font-medium text-gray-900">{order.name}</span>}
                          description={<span className="text-gray-600">{order.email}</span>}
                          avatarProps={{
                            src: order.products.items?.[0]?.images?.[0] || "",
                            size: "md",
                            className: "rounded-lg",
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {process.env.NEXT_PUBLIC_STORE_CURRENCY_SYMBOL} {order.paymentDetails?.total}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                            order.paymentDetails?.paymentStatus === "succeeded" || order.paymentDetails?.paymentStatus === "paid"
                              ? "bg-green-100 text-green-700"
                              : order.paymentDetails?.paymentStatus === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.paymentDetails?.paymentStatus}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-gray-600 text-sm">{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <button onClick={() => handleView(order)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Pagination */}
            {orders.length > rowsPerPage && (
              <div className="block lg:hidden p-4 border-t border-gray-200">
                <Pagination isCompact showControls color="primary" page={page} total={totalPages} onChange={(page) => setPage(page)} className="flex justify-center" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onOpenChange={setModalOpen} size="lg" placement="center">
        <ModalContent className="!p-0 bg-white rounded-xl shadow-xl">
          <ModalHeader className="">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-semibold">Order Details</h2>
            </div>
          </ModalHeader>

          <ModalBody className="px-6 py-5 space-y-5 text-sm text-gray-800">
            {selectedOrder && (
              <>
                {/* Customer & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2">Customer Information</p>
                    <p className="font-medium text-gray-900">{selectedOrder.name}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.email}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2">Contact Number</p>
                    <p className="font-medium text-gray-900">{selectedOrder.shipping?.phone || "Not provided"}</p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-2">Shipping Address</p>
                  <p className="leading-5 text-sm text-gray-700">
                    {selectedOrder.shipping?.address?.address1 && (
                      <>
                        {selectedOrder.shipping.address.address1}
                        {selectedOrder.shipping.address.address2 && `, ${selectedOrder.shipping.address.address2}`}
                        <br />
                        {selectedOrder.shipping.address.city}, {selectedOrder.shipping.address.state}
                        <br />
                        {selectedOrder.shipping.address.country} - {selectedOrder.shipping.address.zip}
                      </>
                    )}
                  </p>
                </div>

                {/* Payment Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-xs text-blue-600 mb-2">Payment Method</p>
                    <p className="font-medium text-gray-900 capitalize">{selectedOrder.paymentDetails?.paymentMethod || "Unknown"}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-xs text-green-600 mb-2">Payment Status</p>
                    <p className="font-medium text-gray-900 capitalize">{selectedOrder.paymentDetails?.paymentStatus || "Unknown"}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-600 mb-2">Total Amount</p>
                  <p className="font-bold text-2xl text-gray-900">
                    {process.env.NEXT_PUBLIC_STORE_CURRENCY_SYMBOL}
                    {selectedOrder.paymentDetails?.total}
                  </p>
                </div>

                {/* Products List */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-4 h-4 text-gray-600" />
                    <p className="text-sm font-medium text-gray-900">Ordered Products</p>
                  </div>
                  <div className="space-y-3">
                    {selectedOrder.products.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100">
                        <img src={item.images?.[0] || "/placeholder-product.png"} alt={item.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span>Qty: {item.quantity}</span>
                            <span>
                              Price: {process.env.NEXT_PUBLIC_STORE_CURRENCY_SYMBOL}
                              {item.sellingPrice}
                            </span>
                            <span className="font-medium">
                              Total: {process.env.NEXT_PUBLIC_STORE_CURRENCY_SYMBOL}
                              {(item.quantity * item.sellingPrice).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </ModalBody>

          <ModalFooter className="px-6 py-4 ">
            <CustomButton 
              intent="secondary" 
              size="sm" 
              onPress={() => setModalOpen(false)}
            >
              Close
            </CustomButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
