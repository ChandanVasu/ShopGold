import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// Define schema
const ProductSchema = new mongoose.Schema({}, {
  timestamps: true,
  versionKey: false,
  strict: false,
});

// Prevent overwrite error
const Product = mongoose.models.Products || mongoose.model("Products", ProductSchema);

// ✅ Route handler for GET /api/product/[id]
export async function GET(req, context) {
  const { params } = await context; // ✅ await context

  const { id } = await params;

  try {
    await dbConnect();

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: "Invalid product ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(product), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET by ID error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch product" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
