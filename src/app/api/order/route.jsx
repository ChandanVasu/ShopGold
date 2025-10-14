// /app/api/admin/orders/route.js
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

// ✅ GET all orders
export async function GET() {
  await dbConnect();
  const orders = await Order.find({});
  return Response.json(orders);
}

// ✅ POST new order (with sessionId check)
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { sessionId } = body;

    if (sessionId) {
      const existingOrder = await Order.findOne({ sessionId });
      if (existingOrder) {
        return Response.json({ message: "Order already exists", order: existingOrder }, { status: 200 });
      }
    }

    // ✅ Create new order (even if sessionId is null)
    const newOrder = await Order.create(body);
    return Response.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Order POST Error:", error);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}

// ✅ PUT update order by _id
export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id, ...updateData } = body;
    if (!_id) return Response.json({ error: "_id is required" }, { status: 400 });

    const updated = await Order.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) return Response.json({ error: "Order not found" }, { status: 404 });

    return Response.json(updated);
  } catch (error) {
    console.error("Order PUT Error:", error);
    return Response.json({ error: "Failed to update order" }, { status: 500 });
  }
}

// ✅ DELETE order by _id
export async function DELETE(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id } = body;
    if (!_id) return Response.json({ error: "_id is required" }, { status: 400 });

    const deleted = await Order.findByIdAndDelete(_id);
    if (!deleted) return Response.json({ error: "Order not found" }, { status: 404 });

    return Response.json({ message: "Order deleted", _id });
  } catch (error) {
    console.error("Order DELETE Error:", error);
    return Response.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
