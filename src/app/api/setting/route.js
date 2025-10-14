import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// ✅ Schema with _id as String to allow different setting types
const schema = new mongoose.Schema(
  {
    _id: { type: String },
  },
  {
    timestamps: true,
    strict: false,
    versionKey: false,
  }
);

const MODEL_NAME = "store-settings";

// Prevent model overwrite error during hot reloads
if (mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME];
}

const StoreModel = mongoose.model(MODEL_NAME, schema, MODEL_NAME);

// POST = save/update settings by type
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "store";

    const _id = type; // Use type as ID: 'store', 'payment', 'integrations'
    const data = { ...body, _id };

    const updated = await StoreModel.findByIdAndUpdate(
      _id,
      data,
      { upsert: true, new: true }
    );

    return Response.json({ message: "Saved", data: updated });
  } catch (err) {
    console.error("Settings save error:", err.message, err.stack);
    return Response.json({ error: err.message || "Failed to save settings" }, { status: 500 });
  }
}

// GET = fetch settings by type
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "store";

    const existing = await StoreModel.findById(type);
    return Response.json(existing || {});
  } catch (err) {
    console.error("Settings fetch error:", err.message);
    return Response.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
