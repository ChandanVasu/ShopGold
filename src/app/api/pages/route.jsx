import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// ✅ Define schema with strict: false to allow any fields (following same pattern as Blog)
const PageSchema = new mongoose.Schema(
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

const Page = mongoose.model("Posts", PageSchema, "Posts");

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

// ✅ GET: Fetch all pages
export async function GET() {
  await dbConnect();
  const pages = await Page.find({ category: "Page" }).sort({ createdAt: -1 });
  const { currencySymbol, storeCurrency } = await getStoreSettings();
  
  // Add store info to each page (for consistency)
  const pagesWithMeta = pages.map(page => ({
    ...page.toObject(),
    currencySymbol,
    storeCurrency,
  }));
  
  return Response.json(pagesWithMeta);
}

// ✅ POST: Create a new page
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // Ensure this is categorized as a page
    const pageData = {
      ...body,
      category: "Page",
      status: body.status || "Draft",
      // Generate slug if not provided
      slug: body.slug || body.title?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `page-${Date.now()}`
    };
    
    const page = await Page.create(pageData);
    return Response.json(page, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return Response.json({ error: "Failed to create page" }, { status: 500 });
  }
}

// ✅ PUT: Update a page by _id
export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return Response.json({ error: "_id is required for update" }, { status: 400 });
    }

    // Ensure category remains as Page
    updateData.category = "Page";
    
    // Update slug if title changed
    if (updateData.title && !updateData.slug) {
      updateData.slug = updateData.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const updatedPage = await Page.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    if (!updatedPage) {
      return Response.json({ error: "Page not found" }, { status: 404 });
    }

    return Response.json(updatedPage);
  } catch (error) {
    console.error("PUT Error:", error);
    return Response.json({ error: "Failed to update page" }, { status: 500 });
  }
}

// ✅ DELETE: Delete a page by _id
export async function DELETE(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id } = body;

    if (!_id) {
      return Response.json({ error: "_id is required for delete" }, { status: 400 });
    }

    const deletedPage = await Page.findByIdAndDelete(_id);

    if (!deletedPage) {
      return Response.json({ error: "Page not found" }, { status: 404 });
    }

    return Response.json({ message: "Page deleted", _id });
  } catch (error) {
    console.error("DELETE Error:", error);
    return Response.json({ error: "Failed to delete page" }, { status: 500 });
  }
}