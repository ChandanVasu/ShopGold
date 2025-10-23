import crypto from "crypto";
import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// Order Schema
const OrderSchema = new mongoose.Schema({}, { timestamps: true, strict: false });
const Order = mongoose.models.Orders || mongoose.model("Orders", OrderSchema);

// Settings Schema
const SettingsSchema = new mongoose.Schema(
  { _id: { type: String } },
  { strict: false, collection: "store-settings", versionKey: false }
);
const Settings = mongoose.models["store-settings"] || mongoose.model("store-settings", SettingsSchema, "store-settings");

async function getPaymentSettings() {
  try {
    const settings = await Settings.findOne({ _id: "payment" });
    return settings;
  } catch (error) {
    console.error("Failed to fetch payment settings:", error);
    return null;
  }
}

function generateHash(data, salt) {
  return crypto.createHash("sha512").update(data + salt).digest("hex");
}

// POST: Create PayU order
export async function POST(req) {
  try {
    await dbConnect();

    const { amount, currency, orderData } = await req.json();
    
    if (!amount || !orderData) {
      return Response.json({ error: "Amount and order data are required" }, { status: 400 });
    }

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.payu?.enabled) {
      return Response.json({ error: "PayU is not enabled" }, { status: 400 });
    }

    if (!paymentSettings.payu.merchantId || !paymentSettings.payu.merchantKey || !paymentSettings.payu.merchantSalt) {
      return Response.json({ error: "PayU credentials not configured" }, { status: 400 });
    }

    // Create transaction ID
    const txnId = `TXN_${Date.now()}`;
    
    // Create order in database first
    const order = await Order.create({
      ...orderData,
      paymentGateway: "payu",
      paymentDetails: {
        txnId: txnId,
        amount: amount,
        currency: currency || "INR",
        status: "pending",
      },
    });

    // Prepare PayU parameters
    const payuData = {
      key: paymentSettings.payu.merchantId,
      txnid: txnId,
      amount: amount.toString(),
      productinfo: "Shop Gold Purchase",
      firstname: orderData.name.split(" ")[0] || "Customer",
      email: orderData.email,
      phone: orderData.phone || "",
      surl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/success?gateway=payu&txnid=${txnId}`,
      furl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/failure?gateway=payu&txnid=${txnId}`,
      service_provider: "payu_paisa",
    };

    // Generate hash
    const hashString = `${payuData.key}|${payuData.txnid}|${payuData.amount}|${payuData.productinfo}|${payuData.firstname}|${payuData.email}|||||||||||${paymentSettings.payu.merchantSalt}`;
    const hash = generateHash(hashString, "");

    // PayU URLs
    const payuUrl = paymentSettings.payu.mode === "live" 
      ? "https://secure.payu.in/_payment"
      : "https://test.payu.in/_payment";

    return Response.json({
      success: true,
      payuUrl: payuUrl,
      payuData: {
        ...payuData,
        hash: hash,
      },
      dbOrderId: order._id,
      txnId: txnId,
    });

  } catch (error) {
    console.error("PayU order creation error:", error);
    return Response.json({ error: "Failed to create PayU order" }, { status: 500 });
  }
}

// PUT: Verify PayU payment
export async function PUT(req) {
  try {
    await dbConnect();

    const { txnid, status, payuMoneyId, dbOrderId } = await req.json();

    if (!txnid || !dbOrderId) {
      return Response.json({ error: "Missing payment verification data" }, { status: 400 });
    }

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.payu?.merchantSalt) {
      return Response.json({ error: "PayU merchant salt not configured" }, { status: 400 });
    }

    // Find order in database
    const order = await Order.findById(dbOrderId);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order based on payment status
    let updateData = {
      "paymentDetails.payuMoneyId": payuMoneyId,
      "paymentDetails.payuStatus": status,
      "paymentDetails.updatedAt": new Date(),
    };

    if (status === "success") {
      updateData["paymentDetails.status"] = "completed";
      updateData["paymentDetails.paidAt"] = new Date();
    } else {
      updateData["paymentDetails.status"] = "failed";
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      dbOrderId,
      updateData,
      { new: true }
    );

    return Response.json({
      success: status === "success",
      message: status === "success" ? "Payment completed successfully" : "Payment failed",
      order: updatedOrder,
      status: status,
    });

  } catch (error) {
    console.error("PayU payment verification error:", error);
    return Response.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}