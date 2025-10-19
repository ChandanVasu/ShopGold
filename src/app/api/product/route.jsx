import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// ✅ Define schema with strict: false to allow any fields
const ProductSchema = new mongoose.Schema(
  {},
  {
    timestamps: true,
    versionKey: false,
    strict: false,
  }
);

// Settings Schema with _id as String
const SettingsSchema = new mongoose.Schema(
  { _id: { type: String } },
  { strict: false, collection: "store-settings", versionKey: false }
);
const Settings = mongoose.models["store-settings"] || mongoose.model("store-settings", SettingsSchema, "store-settings");

// ✅ Fix model reuse during hot reload
if (mongoose.models.Products) {
  delete mongoose.models.Products;
}

const Product = mongoose.model("Products", ProductSchema);

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

// ✅ GET: Fetch all products with currency info
export async function GET() {
  await dbConnect();
  const products = await Product.find({});
  const { currencySymbol, storeCurrency } = await getStoreSettings();
  
  // Add currency info to each product
  const productsWithCurrency = products.map(product => ({
    ...product.toObject(),
    currencySymbol,
    storeCurrency,
  }));
  
  return Response.json(productsWithCurrency);
}

// ✅ POST: Create a new product
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const product = await Product.create(body);
    return Response.json(product, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return Response.json({ error: "Failed to create product" }, { status: 500 });
  }
}

// ✅ PUT: Update a product by _id
export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return Response.json({ error: "_id is required for update" }, { status: 400 });
    }

    const updatedProduct = await Product.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    if (!updatedProduct) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json(updatedProduct);
  } catch (error) {
    console.error("PUT Error:", error);
    return Response.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// ✅ DELETE: Delete a product by _id
export async function DELETE(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id } = body;

    if (!_id) {
      return Response.json({ error: "_id is required for delete" }, { status: 400 });
    }

    const deletedProduct = await Product.findByIdAndDelete(_id);

    if (!deletedProduct) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ message: "Product deleted", _id });
  } catch (error) {
    console.error("DELETE Error:", error);
    return Response.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
