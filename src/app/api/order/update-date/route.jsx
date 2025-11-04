import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// Order Schema without timestamps for manual control
const OrderSchemaNoTimestamps = new mongoose.Schema(
  {},
  {
    timestamps: false,  // Disable automatic timestamps
    versionKey: false,
    strict: false,
  }
);

// Create a separate model for updates to avoid timestamp conflicts
const OrderUpdate = mongoose.models.OrderUpdate || mongoose.model("OrderUpdate", OrderSchemaNoTimestamps, 'orders');

// Regular Order Schema for reading
const OrderSchema = new mongoose.Schema(
  {},
  {
    timestamps: true,
    versionKey: false,
    strict: false,
  }
);

const Order = mongoose.models.Orders || mongoose.model("Orders", OrderSchema);

// ✅ PUT update order createdAt date by _id
export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id, createdAt } = body;
    
    console.log("Update date request:", { _id, createdAt });
    
    if (!_id) {
      return Response.json({ error: "_id is required" }, { status: 400 });
    }
    
    if (!createdAt) {
      return Response.json({ error: "createdAt is required" }, { status: 400 });
    }

    // Validate createdAt date
    const createdDate = new Date(createdAt);
    if (isNaN(createdDate.getTime())) {
      return Response.json({ error: "Invalid createdAt date format" }, { status: 400 });
    }

    console.log("Parsed createdAt date:", createdDate);

    // Find the order first
    const existingOrder = await Order.findById(_id);
    if (!existingOrder) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("Found order:", existingOrder._id);
    console.log("Current createdAt:", existingOrder.createdAt);

    // Use direct MongoDB collection update to bypass Mongoose middleware
    const collection = mongoose.connection.collection('orders');
    const updateResult = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(_id) },
      { 
        $set: { 
          createdAt: createdDate,
          updatedAt: new Date()
        } 
      }
    );

    console.log("Direct MongoDB update result:", updateResult);

    // Also try with the no-timestamps model as a fallback
    if (updateResult.modifiedCount === 0) {
      console.log("Direct update failed, trying with OrderUpdate model...");
      const updateResult2 = await OrderUpdate.updateOne(
        { _id: _id },
        { 
          createdAt: createdDate,
          updatedAt: new Date()
        }
      );
      console.log("OrderUpdate model result:", updateResult2);
    }

    // Verify the update worked by checking the raw document
    const verifyUpdate = await collection.findOne({ _id: new mongoose.Types.ObjectId(_id) });
    console.log("Verification - Raw document from DB:", {
      _id: verifyUpdate._id,
      createdAt: verifyUpdate.createdAt,
      updatedAt: verifyUpdate.updatedAt
    });

    if (updateResult.modifiedCount === 0) {
      return Response.json({ error: "Failed to update order - no documents modified" }, { status: 500 });
    }

    // Fetch the updated order directly from collection to ensure we get the real data
    const updatedOrderRaw = await collection.findOne({ _id: new mongoose.Types.ObjectId(_id) });
    
    console.log("Updated order raw from MongoDB:", updatedOrderRaw);
    console.log("New createdAt from DB:", updatedOrderRaw.createdAt);
    
    // Convert back to Mongoose document for consistent response format
    const updatedOrder = await Order.findById(_id);
    
    return Response.json(updatedOrder);

  } catch (error) {
    console.error("Order Update Date Error:", error);
    return Response.json({ error: "Failed to update order date: " + error.message }, { status: 500 });
  }
}