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

// ✅ GET all orders or search orders
export async function GET(req) {
  await dbConnect();
  
  const url = new URL(req.url);
  const orderId = url.searchParams.get('orderId');
  const phone = url.searchParams.get('phone');
  const email = url.searchParams.get('email');

  // If search parameters provided, search for specific orders
  if (orderId || phone || email) {
    const searchQuery = {};
    
    if (orderId) {
      // Search by sessionId or _id
      searchQuery.$or = [
        { sessionId: orderId },
        { _id: mongoose.Types.ObjectId.isValid(orderId) ? orderId : null }
      ].filter(Boolean);
    }
    
    if (phone) {
      // Search by phone in multiple possible fields
      searchQuery.$or = [
        ...(searchQuery.$or || []),
        { phone: phone },
        { 'shipping.phone': phone }
      ];
    }
    
    if (email) {
      searchQuery.email = email;
    }
    
    const orders = await Order.find(searchQuery).sort({ createdAt: -1 });
    return Response.json(orders);
  }
  
  // Return all orders if no search parameters
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
    const { _id, createdAt, updatedAt, ...updateData } = body;
    if (!_id) return Response.json({ error: "_id is required" }, { status: 400 });

    console.log("PUT request body:", body); // Debug log

    // Handle timestamp updates
    if (createdAt || updatedAt) {
      const timestampUpdates = {};
      
      // Validate and set createdAt if provided
      if (createdAt) {
        const createdDate = new Date(createdAt);
        if (isNaN(createdDate.getTime())) {
          return Response.json({ error: "Invalid createdAt date format" }, { status: 400 });
        }
        timestampUpdates.createdAt = createdDate;
        console.log("Setting createdAt to:", createdDate); // Debug log
      }
      
      // Validate and set updatedAt if provided
      if (updatedAt) {
        const updatedDate = new Date(updatedAt);
        if (isNaN(updatedDate.getTime())) {
          return Response.json({ error: "Invalid updatedAt date format" }, { status: 400 });
        }
        timestampUpdates.updatedAt = updatedDate;
      } else {
        // If only createdAt is being updated, set updatedAt to now
        if (createdAt) {
          timestampUpdates.updatedAt = new Date();
        }
      }
      
      // Merge timestamp updates with other updates
      Object.assign(updateData, timestampUpdates);
    }

    console.log("Final updateData:", updateData); // Debug log

    // Use findByIdAndUpdate with timestamps disabled to override them
    const updated = await Order.findByIdAndUpdate(
      _id, 
      updateData, 
      { 
        new: true,
        timestamps: false // Disable automatic timestamp updates
      }
    );
    
    if (!updated) return Response.json({ error: "Order not found" }, { status: 404 });

    console.log("Updated order:", updated); // Debug log
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
