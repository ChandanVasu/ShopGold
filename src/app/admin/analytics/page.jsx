"use client";

import { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Spinner } from "@heroui/react";
import { TrendingUp, ShoppingBag, DollarSign, Users, ChevronDown, BarChart3, Clock, Filter } from "lucide-react";
import formatDate from "@/utils/formatDate";

export default function AnalyticsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = newest first

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/order");
      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to fetch analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by date
  const filterByDate = (orders) => {
    if (dateFilter === "all") return orders;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    let cutoff;
    switch (dateFilter) {
      case "today":
        cutoff = startOfToday;
        break;
      case "yesterday":
        return orders.filter((o) => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= startOfYesterday && orderDate < startOfToday;
        });
      case "7":
        cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case "30":
        cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        break;
      case "90":
        cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        break;
      default:
        return orders;
    }

    return orders.filter((o) => new Date(o.createdAt) >= cutoff);
  };

  // Apply filters & sorting
  const filteredOrders = filterByDate(orders).sort((a, b) =>
    sortOrder === "desc"
      ? new Date(b.createdAt) - new Date(a.createdAt)
      : new Date(a.createdAt) - new Date(b.createdAt)
  );

  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce(
    (sum, o) => sum + (o.paymentDetails?.total || 0),
    0
  );
  const currencySymbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";
  const uniqueCustomers = new Set(filteredOrders.map((o) => o.email)).size;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const recentOrders = filteredOrders.slice(0, 5);

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
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 text-sm mt-1">
            Overview of your store performance and insights
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={<ShoppingBag size={20} />}
          color="blue"
          trend="+12%"
        />
        <StatCard
          title="Total Revenue"
          value={`${currencySymbol}${totalRevenue.toLocaleString()}`}
          icon={<DollarSign size={20} />}
          color="green"
          trend="+8%"
        />
        <StatCard
          title="Average Order Value"
          value={`${currencySymbol}${averageOrderValue.toFixed(2)}`}
          icon={<TrendingUp size={20} />}
          color="orange"
          trend="+5%"
        />
        <StatCard
          title="Unique Customers"
          value={uniqueCustomers}
          icon={<Users size={20} />}
          color="purple"
          trend="+23%"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <BarChart3 size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <p className="text-sm text-gray-500">Latest {recentOrders.length} orders from your store</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1">
              <ShoppingBag size={12} />
              {recentOrders.length} orders
            </div>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={24} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No orders yet</h3>
            <p className="text-xs text-gray-500">Once you receive orders, they will appear here for analysis.</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Mobile Cards View */}
            <div className="block lg:hidden">
              <div className="p-4">
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                        {order.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">{order.name}</h4>
                        <p className="text-gray-500 text-xs mb-1 truncate">{order.email}</p>
                        <p className="text-gray-400 text-xs truncate">
                          {order.products?.items?.[0]?.title || "No products"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-sm mb-1">
                          {order.paymentDetails?.currencySymbol}
                          {order.paymentDetails?.total?.toLocaleString() || "0"}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                            order.paymentDetails?.paymentStatus === "succeeded" || order.paymentDetails?.paymentStatus === "paid"
                              ? "bg-green-100 text-green-700"
                              : order.paymentDetails?.paymentStatus === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.paymentDetails?.paymentStatus || "Unknown"}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
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
                aria-label="Recent Orders Table"
                classNames={{
                  wrapper: "shadow-none border-none rounded-none",
                  th: "bg-gray-50 text-gray-700 font-medium py-4",
                  td: "py-4"
                }}
              >
                <TableHeader>
                  <TableColumn>Customer</TableColumn>
                  <TableColumn>Product</TableColumn>
                  <TableColumn>Amount</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn className="hidden md:table-cell">Date</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No orders found">
                  {recentOrders.map((order) => (
                    <TableRow key={order._id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
                            {order.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{order.name}</p>
                            <p className="text-xs text-gray-500">{order.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {order.products?.items?.[0]?.title || "No products"}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 text-sm">
                        {order.paymentDetails?.currencySymbol}
                        {order.paymentDetails?.total?.toLocaleString() || "0"}
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
                          {order.paymentDetails?.paymentStatus || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-gray-600 text-sm">
                        {formatDate(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Modern StatCard Component ---- */
function StatCard({ title, value, icon, color, trend }) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    purple: "text-purple-600 bg-purple-50",
    orange: "text-orange-600 bg-orange-50",
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>{icon}</div>
        {trend && (
          <div className="flex items-center gap-1 text-green-600 bg-green-50 rounded-full px-2 py-1">
            <TrendingUp size={12} />
            <span className="text-xs font-medium">{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
