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

// Verify Razorpay webhook signature
function verifyRazorpaySignature(payload, signature, secretKey) {
  const expectedSignature = crypto.createHmac("sha256", secretKey).update(payload).digest("hex");
  return expectedSignature === signature;
}

// POST: Handle Razorpay webhook notifications
export async function POST(req) {
  try {
    await dbConnect();

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.razorpay?.keySecret) {
      return Response.json({ error: "Razorpay secret key not configured" }, { status: 400 });
    }

    // Get webhook data
    const body = await req.text();
    const webhookData = JSON.parse(body);

    // Get signature from headers
    const signature = req.headers.get("x-razorpay-signature");

    // Verify webhook signature (recommended for production)
    if (signature) {
      const isValid = verifyRazorpaySignature(body, signature, paymentSettings.razorpay.keySecret);
      if (!isValid) {
        console.error("Invalid Razorpay webhook signature");
        return Response.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    // Handle different webhook events
    const { event, payload } = webhookData;

    if (event === "payment.captured") {
      const payment = payload.payment.entity;
      
      // Find order in database by Razorpay order ID
      const dbOrder = await Order.findOne({
        "paymentDetails.razorpayOrderId": payment.order_id
      });

      if (dbOrder) {
        // Update order status
        await Order.findByIdAndUpdate(
          dbOrder._id,
          {
            "paymentDetails.status": "completed",
            "paymentDetails.paidAt": new Date(),
            "paymentDetails.razorpayPaymentId": payment.id,
            "paymentDetails.paymentMethod": payment.method,
            "paymentDetails.bankReference": payment.acquirer_data?.bank_transaction_id,
          }
        );

        console.log(`Order ${payment.order_id} payment captured via webhook`);
      }
    } else if (event === "payment.failed") {
      const payment = payload.payment.entity;
      
      // Find order in database
      const dbOrder = await Order.findOne({
        "paymentDetails.razorpayOrderId": payment.order_id
      });

      if (dbOrder) {
        // Update order status to failed
        await Order.findByIdAndUpdate(
          dbOrder._id,
          {
            "paymentDetails.status": "failed",
            "paymentDetails.failureReason": payment.error_description,
          }
        );

        console.log(`Order ${payment.order_id} payment failed via webhook`);
      }
    }

    // Respond to Razorpay webhook
    return Response.json({ 
      message: "Webhook processed successfully",
      event: event 
    });

  } catch (error) {
    console.error("Razorpay webhook processing error:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}