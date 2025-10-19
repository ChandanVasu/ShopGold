import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";
import { writeFile, unlink } from "fs/promises";
import path from "path";

// MongoDB Schema
const ImageSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
  },
  { timestamps: true, versionKey: false }
);

const Image = mongoose.models.Images || mongoose.model("Images", ImageSchema);

export async function GET() {
  await dbConnect();
  const images = await Image.find({});
  return Response.json(images);
}

export async function POST(req) {
  await dbConnect();
  const contentType = req.headers.get("content-type");

  // Handle file upload from FormData
  if (contentType && contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file found" }, { status: 400 });
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Generate unique filename
      const timestamp = Date.now();
      const originalName = file.name.replace(/\s+/g, "-"); // Replace spaces with hyphens
      const filename = `${timestamp}-${originalName}`;
      
      // Save to public/uploads folder
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      const filepath = path.join(uploadDir, filename);
      
      // Create uploads directory if it doesn't exist
      const fs = require("fs");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      await writeFile(filepath, buffer);
      
      // Store relative URL in database
      const imageUrl = `/uploads/${filename}`;

      const savedImage = await Image.create({
        name: file.name,
        url: imageUrl,
      });

      return Response.json(savedImage, { status: 201 });
    } catch (error) {
      console.error("Upload Error:", error);
      return Response.json({ error: "Upload failed" }, { status: 500 });
    }
  }

  // Handle JSON-based POST (manual creation)
  try {
    const body = await req.json();
    const image = await Image.create(body);
    return Response.json(image, { status: 201 });
  } catch (error) {
    console.error("Image JSON POST Error:", error);
    return Response.json({ error: "Failed to create image" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) return Response.json({ error: "_id is required" }, { status: 400 });

    const updatedImage = await Image.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updatedImage) return Response.json({ error: "Image not found" }, { status: 404 });

    return Response.json(updatedImage);
  } catch (error) {
    console.error("Image PUT Error:", error);
    return Response.json({ error: "Failed to update image" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id } = body;

    if (!_id) return Response.json({ error: "_id is required" }, { status: 400 });

    const deletedImage = await Image.findByIdAndDelete(_id);
    if (!deletedImage) return Response.json({ error: "Image not found" }, { status: 404 });

    // Delete file from public folder
    if (deletedImage.url.startsWith("/uploads/")) {
      try {
        const filepath = path.join(process.cwd(), "public", deletedImage.url);
        await unlink(filepath);
      } catch (err) {
        console.warn("File deletion failed:", err.message);
      }
    }

    return Response.json({ message: "Image deleted", _id });
  } catch (error) {
    console.error("Image DELETE Error:", error);
    return Response.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
