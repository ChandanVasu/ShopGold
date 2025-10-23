import Razorpay from "razorpay";
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

// POST: Create Razorpay order
export async function POST(req) {
  try {
    await dbConnect();

    const { amount, currency, orderData } = await req.json();
    
    if (!amount || !orderData) {
      return Response.json({ error: "Amount and order data are required" }, { status: 400 });
    }

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.razorpay?.enabled) {
      return Response.json({ error: "Razorpay is not enabled" }, { status: 400 });
    }

    if (!paymentSettings.razorpay.keyId || !paymentSettings.razorpay.keySecret) {
      return Response.json({ error: "Razorpay credentials not configured" }, { status: 400 });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: paymentSettings.razorpay.keyId,
      key_secret: paymentSettings.razorpay.keySecret,
    });

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency || "INR",
      receipt: `order_${Date.now()}`,
      payment_capture: 1,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Create order in database
    const order = await Order.create({
      ...orderData,
      paymentGateway: "razorpay",
      paymentDetails: {
        orderId: razorpayOrder.id,
        amount: amount,
        currency: currency || "INR",
        status: "pending",
      },
    });

    return Response.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: paymentSettings.razorpay.keyId,
      dbOrderId: order._id,
    });

  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return Response.json({ error: "Failed to create Razorpay order" }, { status: 500 });
  }
}

// PUT: Verify Razorpay payment
export async function PUT(req) {
  try {
    await dbConnect();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !dbOrderId) {
      return Response.json({ error: "Missing payment verification data" }, { status: 400 });
    }

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.razorpay?.keySecret) {
      return Response.json({ error: "Razorpay secret key not configured" }, { status: 400 });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", paymentSettings.razorpay.keySecret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return Response.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Update order in database
    const updatedOrder = await Order.findByIdAndUpdate(
      dbOrderId,
      {
        "paymentDetails.paymentId": razorpay_payment_id,
        "paymentDetails.signature": razorpay_signature,
        "paymentDetails.status": "completed",
        "paymentDetails.paidAt": new Date(),
      },
      { new: true }
    );

    if (!updatedOrder) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: "Payment verified successfully",
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Razorpay payment verification error:", error);
    return Response.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}