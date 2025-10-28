import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// Define schema (same as main blog API)
const BlogSchema = new mongoose.Schema({}, {
  timestamps: true,
  versionKey: false,
  strict: false,
});

// Settings Schema with _id as String
const SettingsSchema = new mongoose.Schema(
  { _id: { type: String } },
  { strict: false, collection: "store-settings", versionKey: false }
);
const Settings = mongoose.models["store-settings"] || mongoose.model("store-settings", SettingsSchema, "store-settings");

// Prevent overwrite error
const Blog = mongoose.models.Posts || mongoose.model("Posts", BlogSchema, "Posts");

// Helper function to get store settings
async function getStoreSettings() {
  try {
    const settings = await Settings.findOne({ _id: "store" });
    return {
      currencySymbol: settings?.currencySymbol || "$",
      storeCurrency: settings?.storeCurrency || "USD",
    };
  } catch (error) {
    console.error("Failed to fetch store settings:", error);
    return {
      currencySymbol: "$",
      storeCurrency: "USD",
    };
  }
}

// ✅ Route handler for GET /api/blog/[id]
export async function GET(req, context) {
  const { params } = await context; // ✅ await context

  const { id } = await params;

  try {
    await dbConnect();

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: "Invalid blog post ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const post = await Blog.findOne({ _id: id, category: "Blog" });

    if (!post) {
      return new Response(JSON.stringify({ error: "Blog post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Add store info to post
    const { currencySymbol, storeCurrency } = await getStoreSettings();
    const postWithMeta = {
      ...post.toObject(),
      currencySymbol,
      storeCurrency,
    };

    return new Response(JSON.stringify(postWithMeta), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET by ID error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch blog post" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}