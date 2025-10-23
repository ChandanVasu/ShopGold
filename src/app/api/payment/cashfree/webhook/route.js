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

// Verify Cashfree webhook signature
function verifyCashfreeSignature(payload, signature, timestamp, secretKey) {
  const signatureData = `${payload}${timestamp}`;
  const expectedSignature = crypto.createHmac("sha256", secretKey).update(signatureData).digest("base64");
  return expectedSignature === signature;
}

// POST: Handle Cashfree webhook notifications
export async function POST(req) {
  try {
    await dbConnect();

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.cashfree?.secretKey) {
      return Response.json({ error: "Cashfree secret key not configured" }, { status: 400 });
    }

    // Get webhook data
    const body = await req.text();
    const webhookData = JSON.parse(body);

    // Get headers for signature verification
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");

    // Verify webhook signature (recommended for production)
    if (signature && timestamp) {
      const isValid = verifyCashfreeSignature(body, signature, timestamp, paymentSettings.cashfree.secretKey);
      if (!isValid) {
        console.error("Invalid Cashfree webhook signature");
        return Response.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    // Handle different webhook events
    const { type, data } = webhookData;

    if (type === "PAYMENT_SUCCESS_WEBHOOK") {
      const { order } = data;
      
      // Find order in database by Cashfree order ID
      const dbOrder = await Order.findOne({
        "paymentDetails.cfOrderId": order.cf_order_id
      });

      if (dbOrder) {
        // Update order status
        await Order.findByIdAndUpdate(
          dbOrder._id,
          {
            "paymentDetails.status": "completed",
            "paymentDetails.paidAt": new Date(),
            "paymentDetails.orderStatus": order.order_status,
            "paymentDetails.cfTransactionId": data.payment?.cf_payment_id,
            "paymentDetails.paymentMethod": data.payment?.payment_method,
            "paymentDetails.bankReference": data.payment?.bank_reference,
          }
        );

        console.log(`Order ${order.order_id} payment confirmed via webhook`);
      }
    } else if (type === "PAYMENT_FAILED_WEBHOOK") {
      const { order } = data;
      
      // Find order in database
      const dbOrder = await Order.findOne({
        "paymentDetails.cfOrderId": order.cf_order_id
      });

      if (dbOrder) {
        // Update order status to failed
        await Order.findByIdAndUpdate(
          dbOrder._id,
          {
            "paymentDetails.status": "failed",
            "paymentDetails.orderStatus": order.order_status,
            "paymentDetails.failureReason": data.payment?.payment_message,
          }
        );

        console.log(`Order ${order.order_id} payment failed via webhook`);
      }
    }

    // Respond to Cashfree webhook
    return Response.json({ 
      message: "Webhook processed successfully",
      type: type 
    });

  } catch (error) {
    console.error("Cashfree webhook processing error:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}