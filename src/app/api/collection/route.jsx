// /app/api/admin/collection/route.js
import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// Allow flexible schema
const CollectionSchema = new mongoose.Schema(
  {},
  {
    timestamps: true,
    versionKey: false,
    strict: false,
  }
);

if (mongoose.models.Collections) {
  delete mongoose.models.Collections;
}

const Collection = mongoose.model("Collections", CollectionSchema);

export async function GET() {
  await dbConnect();
  const data = await Collection.find({});
  return Response.json(data);
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const doc = await Collection.create(body);
    return Response.json(doc, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return Response.json({ error: "Failed to create document" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id, ...updateData } = body;
    if (!_id) return Response.json({ error: "_id is required" }, { status: 400 });

    const updated = await Collection.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) return Response.json({ error: "Document not found" }, { status: 404 });

    return Response.json(updated);
  } catch (error) {
    console.error("PUT Error:", error);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id } = body;
    if (!_id) return Response.json({ error: "_id is required" }, { status: 400 });

    const deleted = await Collection.findByIdAndDelete(_id);
    if (!deleted) return Response.json({ error: "Document not found" }, { status: 404 });

    return Response.json({ message: "Deleted successfully", _id });
  } catch (error) {
    console.error("DELETE Error:", error);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
