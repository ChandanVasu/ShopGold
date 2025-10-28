import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// Define schema (same as main pages API)
const PageSchema = new mongoose.Schema({}, {
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
const Page = mongoose.models.Posts || mongoose.model("Posts", PageSchema, "Posts");

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

// ✅ Route handler for GET /api/pages/[id]
export async function GET(req, context) {
  const { params } = await context; // ✅ await context

  const { id } = await params;

  try {
    await dbConnect();

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: "Invalid page ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const page = await Page.findOne({ _id: id, category: "Page" });

    if (!page) {
      return new Response(JSON.stringify({ error: "Page not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Add store info to page
    const { currencySymbol, storeCurrency } = await getStoreSettings();
    const pageWithMeta = {
      ...page.toObject(),
      currencySymbol,
      storeCurrency,
    };

    return new Response(JSON.stringify(pageWithMeta), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET by ID error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch page" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}