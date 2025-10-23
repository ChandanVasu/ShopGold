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

// Verify PhonePe webhook signature
function verifyPhonePeSignature(payload, signature, saltKey, saltIndex) {
  const saltKeyHash = crypto.createHash("sha256").update(saltKey).digest("hex");
  const checkString = payload + "/pg/v1/status/" + saltKeyHash;
  const expectedSignature = crypto.createHash("sha256").update(checkString).digest("hex") + "###" + saltIndex;
  return expectedSignature === signature;
}

// POST: Handle PhonePe webhook notifications
export async function POST(req) {
  try {
    await dbConnect();

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.phonepe?.saltKey) {
      return Response.json({ error: "PhonePe salt key not configured" }, { status: 400 });
    }

    // Get webhook data
    const body = await req.text();
    const webhookData = JSON.parse(body);

    // Get signature from headers
    const signature = req.headers.get("x-verify");

    // Verify webhook signature (recommended for production)
    if (signature) {
      const isValid = verifyPhonePeSignature(
        body, 
        signature, 
        paymentSettings.phonepe.saltKey, 
        paymentSettings.phonepe.saltIndex || "1"
      );
      if (!isValid) {
        console.error("Invalid PhonePe webhook signature");
        return Response.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    // Handle payment status
    const { response } = webhookData;
    
    if (response && response.success === true) {
      const { data } = response;
      
      // Find order in database by merchant transaction ID
      const dbOrder = await Order.findOne({
        "paymentDetails.phonepeMerchantTransactionId": data.merchantTransactionId
      });

      if (dbOrder) {
        // Update order status
        await Order.findByIdAndUpdate(
          dbOrder._id,
          {
            "paymentDetails.status": "completed",
            "paymentDetails.paidAt": new Date(),
            "paymentDetails.phonepeTransactionId": data.transactionId,
            "paymentDetails.paymentMethod": data.paymentInstrument?.type,
            "paymentDetails.responseCode": data.responseCode,
          }
        );

        console.log(`Order ${data.merchantTransactionId} payment successful via webhook`);
      }
    } else if (response && response.success === false) {
      const { data } = response;
      
      // Find order in database
      const dbOrder = await Order.findOne({
        "paymentDetails.phonepeMerchantTransactionId": data.merchantTransactionId
      });

      if (dbOrder) {
        // Update order status to failed
        await Order.findByIdAndUpdate(
          dbOrder._id,
          {
            "paymentDetails.status": "failed",
            "paymentDetails.failureReason": data.responseCodeDescription || "Payment failed",
            "paymentDetails.responseCode": data.responseCode,
          }
        );

        console.log(`Order ${data.merchantTransactionId} payment failed via webhook`);
      }
    }

    // Respond to PhonePe webhook
    return Response.json({ 
      message: "Webhook processed successfully",
      success: response?.success 
    });

  } catch (error) {
    console.error("PhonePe webhook processing error:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}