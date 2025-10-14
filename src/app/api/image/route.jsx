import { v2 as cloudinary } from "cloudinary";
import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: process.env.CLOUDINARY_FOLDER,
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer); // send buffer directly
      });

      const savedImage = await Image.create({
        name: file.name,
        url: uploadResult.secure_url,
      });

      return Response.json(savedImage, { status: 201 });
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
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

    // Optional: Also delete from Cloudinary
    const publicId = deletedImage.url.split("/").slice(-1)[0].split(".")[0]; // extract file name (no extension)
    const folder = process.env.CLOUDINARY_FOLDER;
    const cloudinaryId = `${folder}/${publicId}`;

    try {
      await cloudinary.uploader.destroy(cloudinaryId);
    } catch (err) {
      console.warn("Cloudinary delete failed:", err.message);
    }

    return Response.json({ message: "Image deleted", _id });
  } catch (error) {
    console.error("Image DELETE Error:", error);
    return Response.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
