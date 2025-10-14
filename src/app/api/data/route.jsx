// /app/api/admin/store/route.js
import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";
import { NextRequest } from "next/server";

// 🔧 Get model dynamically
function getDynamicModel(collectionName) {
  const schema = new mongoose.Schema(
    {},
    {
      timestamps: true,
      versionKey: false,
      strict: false,
    }
  );

  if (mongoose.models[collectionName]) {
    delete mongoose.models[collectionName];
  }

  return mongoose.model(collectionName, schema, collectionName);
}

// ✅ GET store data (use search param ?collection=YourCollection)
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const collection = searchParams.get("collection");

  if (!collection) {
    return Response.json({ error: "Collection name required" }, { status: 400 });
  }

  const Model = getDynamicModel(collection);
  const data = await Model.find({});
  return Response.json(data);
}

// ✅ POST store data (must send `collection` in body)
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { collection, ...data } = body;

    if (!collection) {
      return Response.json({ error: "Collection name required" }, { status: 400 });
    }

    const Model = getDynamicModel(collection);
    const doc = await Model.create(data);
    return Response.json(doc, { status: 201 });
  } catch (error) {
    console.error("Store POST Error:", error);
    return Response.json({ error: "Failed to create" }, { status: 500 });
  }
}

// ✅ PUT update store item by _id
export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id, collection, ...updateData } = body;

    if (!collection || !_id) {
      return Response.json({ error: "Collection and _id required" }, { status: 400 });
    }

    const Model = getDynamicModel(collection);
    const updated = await Model.findByIdAndUpdate(_id, updateData, { new: true });

    if (!updated) return Response.json({ error: "Item not found" }, { status: 404 });

    return Response.json(updated);
  } catch (error) {
    console.error("Store PUT Error:", error);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}

// ✅ DELETE store item by _id
export async function DELETE(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { collection, _id } = body;

    if (!collection || !_id) {
      return Response.json({ error: "Collection and _id required" }, { status: 400 });
    }

    const Model = getDynamicModel(collection);
    const deleted = await Model.findByIdAndDelete(_id);

    if (!deleted) return Response.json({ error: "Item not found" }, { status: 404 });

    return Response.json({ message: "Deleted", _id });
  } catch (error) {
    console.error("Store DELETE Error:", error);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
