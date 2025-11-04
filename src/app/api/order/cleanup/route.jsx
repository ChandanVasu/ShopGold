// Cleanup API to remove duplicate legacy orders
import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// Order Schema
const OrderSchema = new mongoose.Schema(
  {},
  {
    timestamps: true,
    versionKey: false,
    strict: false,
  }
);

if (mongoose.models.Orders) {
  delete mongoose.models.Orders;
}
const Order = mongoose.model("Orders", OrderSchema);

// POST: Cleanup duplicate legacy orders
export async function POST(req) {
  try {
    await dbConnect();

    // Find all orders that have both legacy and new formats for the same phone number
    const orders = await Order.find({}).sort({ createdAt: 1 });

    const phoneGroups = {};
    const duplicatesToDelete = [];

    // Group orders by phone number
    orders.forEach((order) => {
      const phone = order.phone || order.shipping?.phone;
      if (phone) {
        if (!phoneGroups[phone]) {
          phoneGroups[phone] = [];
        }
        phoneGroups[phone].push(order);
      }
    });

    // Identify legacy duplicates to delete
    Object.keys(phoneGroups).forEach((phone) => {
      const phoneOrders = phoneGroups[phone];

      if (phoneOrders.length > 1) {
        // Sort by creation date
        phoneOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Group by approximate time (within 1 minute = same transaction)
        let currentGroup = [phoneOrders[0]];

        for (let i = 1; i < phoneOrders.length; i++) {
          const currentOrder = phoneOrders[i];
          const lastOrder = currentGroup[currentGroup.length - 1];

          const timeDiff = Math.abs(new Date(currentOrder.createdAt) - new Date(lastOrder.createdAt));

          if (timeDiff <= 60000) {
            // Within 1 minute
            currentGroup.push(currentOrder);
          } else {
            // Process current group
            if (currentGroup.length > 1) {
              // Keep the order with shipping and products fields (new format)
              const newFormatOrder = currentGroup.find((o) => o.shipping && o.products);
              const legacyOrders = currentGroup.filter((o) => !o.shipping || !o.products);

              if (newFormatOrder && legacyOrders.length > 0) {
                duplicatesToDelete.push(...legacyOrders.map((o) => o._id));
              }
            }
            currentGroup = [currentOrder];
          }
        }

        // Process last group
        if (currentGroup.length > 1) {
          const newFormatOrder = currentGroup.find((o) => o.shipping && o.products);
          const legacyOrders = currentGroup.filter((o) => !o.shipping || !o.products);

          if (newFormatOrder && legacyOrders.length > 0) {
            duplicatesToDelete.push(...legacyOrders.map((o) => o._id));
          }
        }
      }
    });

    // Delete legacy duplicate orders
    if (duplicatesToDelete.length > 0) {
      const deleteResult = await Order.deleteMany({
        _id: { $in: duplicatesToDelete },
      });

      return Response.json({
        success: true,
        message: `Cleaned up ${deleteResult.deletedCount} duplicate legacy orders`,
        deletedOrderIds: duplicatesToDelete,
      });
    } else {
      return Response.json({
        success: true,
        message: "No duplicate orders found to cleanup",
      });
    }
  } catch (error) {
    console.error("Order cleanup error:", error);
    return Response.json({ error: "Failed to cleanup orders" }, { status: 500 });
  }
}

// GET: Preview what orders would be deleted (dry run)
export async function GET(req) {
  try {
    await dbConnect();

    const orders = await Order.find({}).sort({ createdAt: 1 });

    const phoneGroups = {};
    const duplicatesToDelete = [];

    // Group orders by phone number
    orders.forEach((order) => {
      const phone = order.phone || order.shipping?.phone;
      if (phone) {
        if (!phoneGroups[phone]) {
          phoneGroups[phone] = [];
        }
        phoneGroups[phone].push(order);
      }
    });

    // Identify legacy duplicates to delete
    Object.keys(phoneGroups).forEach((phone) => {
      const phoneOrders = phoneGroups[phone];

      if (phoneOrders.length > 1) {
        phoneOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        let currentGroup = [phoneOrders[0]];

        for (let i = 1; i < phoneOrders.length; i++) {
          const currentOrder = phoneOrders[i];
          const lastOrder = currentGroup[currentGroup.length - 1];

          const timeDiff = Math.abs(new Date(currentOrder.createdAt) - new Date(lastOrder.createdAt));

          if (timeDiff <= 60000) {
            // Within 1 minute
            currentGroup.push(currentOrder);
          } else {
            if (currentGroup.length > 1) {
              const newFormatOrder = currentGroup.find((o) => o.shipping && o.products);
              const legacyOrders = currentGroup.filter((o) => !o.shipping || !o.products);

              if (newFormatOrder && legacyOrders.length > 0) {
                duplicatesToDelete.push(
                  ...legacyOrders.map((o) => ({
                    _id: o._id,
                    phone: o.phone,
                    createdAt: o.createdAt,
                    hasShipping: !!o.shipping,
                    hasProducts: !!o.products,
                    reason: "Legacy format duplicate",
                  }))
                );
              }
            }
            currentGroup = [currentOrder];
          }
        }

        if (currentGroup.length > 1) {
          const newFormatOrder = currentGroup.find((o) => o.shipping && o.products);
          const legacyOrders = currentGroup.filter((o) => !o.shipping || !o.products);

          if (newFormatOrder && legacyOrders.length > 0) {
            duplicatesToDelete.push(
              ...legacyOrders.map((o) => ({
                _id: o._id,
                phone: o.phone,
                createdAt: o.createdAt,
                hasShipping: !!o.shipping,
                hasProducts: !!o.products,
                reason: "Legacy format duplicate",
              }))
            );
          }
        }
      }
    });

    return Response.json({
      totalOrders: orders.length,
      duplicatesFound: duplicatesToDelete.length,
      duplicatesToDelete: duplicatesToDelete,
      phoneNumbers: Object.keys(phoneGroups).length,
    });
  } catch (error) {
    console.error("Order cleanup preview error:", error);
    return Response.json({ error: "Failed to preview cleanup" }, { status: 500 });
  }
}
