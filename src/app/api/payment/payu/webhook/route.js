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

// Verify PayU webhook signature
function verifyPayUSignature(payload, hash, salt) {
  const expectedHash = crypto.createHash("sha512").update(payload + salt).digest("hex");
  return expectedHash === hash;
}

// POST: Handle PayU webhook notifications
export async function POST(req) {
  try {
    await dbConnect();

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.payu?.salt) {
      return Response.json({ error: "PayU salt not configured" }, { status: 400 });
    }

    // Get form data from PayU webhook
    const formData = await req.formData();
    const webhookData = {};
    
    for (const [key, value] of formData.entries()) {
      webhookData[key] = value;
    }

    // Verify hash if provided
    if (webhookData.hash) {
      const payloadString = `${webhookData.key}|${webhookData.txnid}|${webhookData.amount}|${webhookData.productinfo}|${webhookData.firstname}|${webhookData.email}|||||||||||${webhookData.status}|${webhookData.udf1}|${webhookData.udf2}|${webhookData.udf3}|${webhookData.udf4}|${webhookData.udf5}|${webhookData.field6}|${webhookData.field7}|${webhookData.field8}|${webhookData.field9}|${webhookData.field10}|`;
      
      const isValid = verifyPayUSignature(payloadString, webhookData.hash, paymentSettings.payu.salt);
      if (!isValid) {
        console.error("Invalid PayU webhook signature");
        return Response.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    // Handle payment status
    if (webhookData.status === "success") {
      // Find order in database by transaction ID
      const dbOrder = await Order.findOne({
        "paymentDetails.payuTxnId": webhookData.txnid
      });

      if (dbOrder) {
        // Update order status
        await Order.findByIdAndUpdate(
          dbOrder._id,
          {
            "paymentDetails.status": "completed",
            "paymentDetails.paidAt": new Date(),
            "paymentDetails.payuPaymentId": webhookData.mihpayid,
            "paymentDetails.paymentMethod": webhookData.mode,
            "paymentDetails.bankReference": webhookData.bank_ref_num,
          }
        );

        console.log(`Order ${webhookData.txnid} payment successful via webhook`);
      }
    } else if (webhookData.status === "failure") {
      // Find order in database
      const dbOrder = await Order.findOne({
        "paymentDetails.payuTxnId": webhookData.txnid
      });

      if (dbOrder) {
        // Update order status to failed
        await Order.findByIdAndUpdate(
          dbOrder._id,
          {
            "paymentDetails.status": "failed",
            "paymentDetails.failureReason": webhookData.error_Message || "Payment failed",
          }
        );

        console.log(`Order ${webhookData.txnid} payment failed via webhook`);
      }
    }

    // Respond to PayU webhook
    return Response.json({ 
      message: "Webhook processed successfully",
      status: webhookData.status 
    });

  } catch (error) {
    console.error("PayU webhook processing error:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}