// /app/api/dev/delete-collection/route.js
import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    let collectionName = searchParams.get("collection");

    if (!collectionName) {
      const body = await req.json();
      collectionName = body.collection;
    }

    if (!collectionName) {
      return Response.json({ error: "Collection name required" }, { status: 400 });
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    const actualCollection = collections.find((col) => col.name.toLowerCase() === collectionName.toLowerCase());

    if (!actualCollection) {
      return Response.json({ error: "Collection not found" }, { status: 404 });
    }

    await mongoose.connection.db.dropCollection(actualCollection.name);

    return Response.json({
      message: `Collection '${actualCollection.name}' deleted successfully`,
    });
  } catch (error) {
    console.error("Delete Collection Error:", error);
    return Response.json({ error: "Failed to delete collection" }, { status: 500 });
  }
}
