import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// Order Settings Schema
const OrderSettingsSchema = new mongoose.Schema(
  {
    // Timing settings in hours
    dispatchAfterHours: { type: Number, default: 24 }, // Dispatch after 24 hours
    inTransitAfterHours: { type: Number, default: 48 }, // In transit after 48 hours
    outForDeliveryAfterHours: { type: Number, default: 96 }, // Out for delivery after 96 hours (4 days)
    deliveredAfterHours: { type: Number, default: 120 }, // Delivered after 120 hours (5 days)
    
    // Additional settings
    autoUpdateStatus: { type: Boolean, default: true },
    defaultSettings: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

if (mongoose.models.OrderSettings) {
  delete mongoose.models.OrderSettings;
}

const OrderSettings = mongoose.model("OrderSettings", OrderSettingsSchema);

// ✅ GET order settings
export async function GET(req) {
  try {
    await dbConnect();
    
    let settings = await OrderSettings.findOne({ defaultSettings: true });
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await OrderSettings.create({
        dispatchAfterHours: 24,
        inTransitAfterHours: 48,
        outForDeliveryAfterHours: 96,
        deliveredAfterHours: 120,
        autoUpdateStatus: true,
        defaultSettings: true,
      });
    }
    
    return Response.json(settings);
  } catch (error) {
    console.error("Order Settings GET Error:", error);
    return Response.json({ error: "Failed to fetch order settings" }, { status: 500 });
  }
}

// ✅ PUT update order settings
export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { 
      dispatchAfterHours, 
      inTransitAfterHours, 
      outForDeliveryAfterHours, 
      deliveredAfterHours,
      autoUpdateStatus 
    } = body;
    
    console.log("Updating order settings:", body);
    
    // Validation
    if (dispatchAfterHours < 0 || inTransitAfterHours < 0 || outForDeliveryAfterHours < 0 || deliveredAfterHours < 0) {
      return Response.json({ error: "Hours cannot be negative" }, { status: 400 });
    }
    
    // Ensure logical sequence (each stage should be after the previous one)
    if (inTransitAfterHours <= dispatchAfterHours) {
      return Response.json({ error: "In-transit time must be after dispatch time" }, { status: 400 });
    }
    
    if (outForDeliveryAfterHours <= inTransitAfterHours) {
      return Response.json({ error: "Out-for-delivery time must be after in-transit time" }, { status: 400 });
    }
    
    if (deliveredAfterHours <= outForDeliveryAfterHours) {
      return Response.json({ error: "Delivered time must be after out-for-delivery time" }, { status: 400 });
    }
    
    // Update or create settings
    const updatedSettings = await OrderSettings.findOneAndUpdate(
      { defaultSettings: true },
      {
        dispatchAfterHours,
        inTransitAfterHours,
        outForDeliveryAfterHours,
        deliveredAfterHours,
        autoUpdateStatus: autoUpdateStatus !== undefined ? autoUpdateStatus : true,
        defaultSettings: true,
      },
      { new: true, upsert: true }
    );
    
    console.log("Updated settings:", updatedSettings);
    
    return Response.json(updatedSettings);
  } catch (error) {
    console.error("Order Settings PUT Error:", error);
    return Response.json({ error: "Failed to update order settings" }, { status: 500 });
  }
}

// ✅ POST create/reset to default settings
export async function POST(req) {
  try {
    await dbConnect();
    
    // Delete existing settings and create new default ones
    await OrderSettings.deleteMany({ defaultSettings: true });
    
    const defaultSettings = await OrderSettings.create({
      dispatchAfterHours: 24,
      inTransitAfterHours: 48,
      outForDeliveryAfterHours: 96,
      deliveredAfterHours: 120,
      autoUpdateStatus: true,
      defaultSettings: true,
    });
    
    return Response.json(defaultSettings, { status: 201 });
  } catch (error) {
    console.error("Order Settings POST Error:", error);
    return Response.json({ error: "Failed to reset order settings" }, { status: 500 });
  }
}