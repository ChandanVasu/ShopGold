"use client";

import { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Pagination, Spinner } from "@heroui/react";
import formatDate from "@/utils/formatDate";
import Empty from "@/components/block/Empty";

export default function PaymentTablePage() {
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState(null);

  const totalPages = Math.ceil(payments.length / rowsPerPage);
  const paginatedPayments = payments.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    fetchPayments();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/setting?type=store", {
        cache: "force-cache",
        next: { revalidate: 300 }
      });
      const data = await res.json();
      setStoreSettings(data);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/order");
      const data = await res.json();
      const filteredData = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPayments(filteredData);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = storeSettings?.currencySymbol || "$";

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "succeeded":
      case "paid":
        return "bg-green-100 text-green-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
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
    <div className="px-5 py-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">Track all customer transactions and their status.</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <Empty title="No Payments Found" description="There are no payment records available at the moment." />
      ) : (
        <div className="overflow-auto">
          <Table
            shadow="none"
            aria-label="Payment Table"
            bottomContent={
              payments.length > rowsPerPage ? (
                <div className="w-full flex justify-center mt-4 sticky bottom-0 bg-white py-2 z-10">
                  <Pagination isCompact showControls showShadow color="secondary" page={page} total={totalPages} onChange={(page) => setPage(page)} />
                </div>
              ) : null
            }
          >
            <TableHeader>
              <TableColumn>Customer Name</TableColumn>
              <TableColumn>Email Address</TableColumn>
              <TableColumn>Amount</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Payment Method</TableColumn>
              <TableColumn>Date</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedPayments.map((order) => (
                <TableRow key={order._id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-medium text-gray-900">{order.name || "N/A"}</TableCell>
                  <TableCell className="text-gray-600">{order.email || "N/A"}</TableCell>
                  <TableCell className="font-semibold text-gray-900">
                    <span className="">
                      {order.paymentDetails?.currencySymbol || currencySymbol}
                      {order.paymentDetails?.total?.toLocaleString() || "0"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.paymentDetails?.paymentStatus)}`}>
                      {order.paymentDetails?.paymentStatus || "Unknown"}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700">
                    <span className="capitalize">{order.paymentDetails?.paymentMethod || "N/A"}</span>
                  </TableCell>
                  <TableCell className="text-gray-500">{formatDate(order.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
