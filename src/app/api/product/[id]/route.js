import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// Define schema
const ProductSchema = new mongoose.Schema({}, {
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
const Product = mongoose.models.Products || mongoose.model("Products", ProductSchema);

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

    // Add currency info to product
    const { currencySymbol, storeCurrency } = await getStoreSettings();
    const productWithCurrency = {
      ...product.toObject(),
      currencySymbol,
      storeCurrency,
    };

    return new Response(JSON.stringify(productWithCurrency), {
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
