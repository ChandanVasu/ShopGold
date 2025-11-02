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

// ✅ PUT: Update document by ID
export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const data = await req.json();
    const { collection, ...updateData } = data;

    if (!collection) {
      return Response.json({ error: "Collection is required" }, { status: 400 });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const Model = getDynamicModel(collection);
    const updatedDoc = await Model.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!updatedDoc) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    return Response.json(updatedDoc);
  } catch (error) {
    console.error("PUT error:", error);
    return Response.json({ error: "Failed to update document" }, { status: 500 });
  }
}

// ✅ DELETE: Delete document by ID
export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get("collection");

    if (!collection) {
      return Response.json({ error: "Collection is required" }, { status: 400 });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const Model = getDynamicModel(collection);
    const deletedDoc = await Model.findByIdAndDelete(id);

    if (!deletedDoc) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    return Response.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error);
    return Response.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
