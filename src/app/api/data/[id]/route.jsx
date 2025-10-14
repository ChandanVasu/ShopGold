import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

function getDynamicModel(collectionName) {
  const schema = new mongoose.Schema(
    {},
    {
      timestamps: true,
      versionKey: false,
      strict: false,
    }
  );

  // Prevent overwrite model error
  if (mongoose.models[collectionName]) {
    delete mongoose.models[collectionName];
  }

  return mongoose.model(collectionName, schema, collectionName);
}

// ✅ GET: Fetch single document by ID (e.g. ?collection=Posts&id=123)
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const collection = searchParams.get("collection");
    const id = searchParams.get("id");

    if (!collection || !id) {
      return Response.json({ error: "Collection and ID are required" }, { status: 400 });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const Model = getDynamicModel(collection);
    const doc = await Model.findById(id);

    if (!doc) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    return Response.json(doc);
  } catch (error) {
    console.error("GET by ID error:", error);
    return Response.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}
