import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// ✅ Define schema with strict: false to allow any fields (following same pattern as Products)
const BlogSchema = new mongoose.Schema(
  {},
  {
    timestamps: true,
    versionKey: false,
    strict: false,
  }
);

// Settings Schema for store settings (if needed)
const SettingsSchema = new mongoose.Schema(
  { _id: { type: String } },
  { strict: false, collection: "store-settings", versionKey: false }
);
const Settings = mongoose.models["store-settings"] || mongoose.model("store-settings", SettingsSchema, "store-settings");

// ✅ Fix model reuse during hot reload
if (mongoose.models.Posts) {
  delete mongoose.models.Posts;
}

const Blog = mongoose.model("Posts", BlogSchema, "Posts");

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

// ✅ GET: Fetch all blog posts
export async function GET() {
  await dbConnect();
  const posts = await Blog.find({ category: "Blog" }).sort({ createdAt: -1 });
  const { currencySymbol, storeCurrency } = await getStoreSettings();
  
  // Add store info to each post (for consistency)
  const postsWithMeta = posts.map(post => ({
    ...post.toObject(),
    currencySymbol,
    storeCurrency,
  }));
  
  return Response.json(postsWithMeta);
}

// ✅ POST: Create a new blog post
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // Ensure this is categorized as a blog post
    const blogData = {
      ...body,
      category: "Blog",
      status: body.status || "Draft",
      // Generate slug if not provided
      slug: body.slug || body.title?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `blog-${Date.now()}`
    };
    
    const post = await Blog.create(blogData);
    return Response.json(post, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return Response.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}

// ✅ PUT: Update a blog post by _id
export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return Response.json({ error: "_id is required for update" }, { status: 400 });
    }

    // Ensure category remains as Blog
    updateData.category = "Blog";
    
    // Update slug if title changed
    if (updateData.title && !updateData.slug) {
      updateData.slug = updateData.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const updatedPost = await Blog.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    if (!updatedPost) {
      return Response.json({ error: "Blog post not found" }, { status: 404 });
    }

    return Response.json(updatedPost);
  } catch (error) {
    console.error("PUT Error:", error);
    return Response.json({ error: "Failed to update blog post" }, { status: 500 });
  }
}

// ✅ DELETE: Delete a blog post by _id
export async function DELETE(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id } = body;

    if (!_id) {
      return Response.json({ error: "_id is required for delete" }, { status: 400 });
    }

    const deletedPost = await Blog.findByIdAndDelete(_id);

    if (!deletedPost) {
      return Response.json({ error: "Blog post not found" }, { status: 404 });
    }

    return Response.json({ message: "Blog post deleted", _id });
  } catch (error) {
    console.error("DELETE Error:", error);
    return Response.json({ error: "Failed to delete blog post" }, { status: 500 });
  }
}