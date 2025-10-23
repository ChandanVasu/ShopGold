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

// Verify Paytm webhook signature
function verifyPaytmSignature(payload, signature, merchantKey) {
  const expectedSignature = crypto.createHmac("sha256", merchantKey).update(payload).digest("hex");
  return expectedSignature === signature;
}

// POST: Handle Paytm webhook notifications
export async function POST(req) {
  try {
    await dbConnect();

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.paytm?.merchantKey) {
      return Response.json({ error: "Paytm merchant key not configured" }, { status: 400 });
    }

    // Get webhook data
    const body = await req.text();
    const webhookData = JSON.parse(body);

    // Get signature from headers
    const signature = req.headers.get("x-paytm-signature");

    // Verify webhook signature (recommended for production)
    if (signature) {
      const isValid = verifyPaytmSignature(body, signature, paymentSettings.paytm.merchantKey);
      if (!isValid) {
        console.error("Invalid Paytm webhook signature");
        return Response.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    // Handle payment status
    const { ORDERID, TXNID, STATUS, RESPCODE, RESPMSG, PAYMENTMODE, BANKTXNID } = webhookData;
    
    if (STATUS === "TXN_SUCCESS") {
      // Find order in database by order ID
      const dbOrder = await Order.findOne({
        "paymentDetails.paytmOrderId": ORDERID
      });

      if (dbOrder) {
        // Update order status
        await Order.findByIdAndUpdate(
          dbOrder._id,
          {
            "paymentDetails.status": "completed",
            "paymentDetails.paidAt": new Date(),
            "paymentDetails.paytmTxnId": TXNID,
            "paymentDetails.paymentMethod": PAYMENTMODE,
            "paymentDetails.bankReference": BANKTXNID,
            "paymentDetails.responseCode": RESPCODE,
            "paymentDetails.responseMessage": RESPMSG,
          }
        );

        console.log(`Order ${ORDERID} payment successful via webhook`);
      }
    } else if (STATUS === "TXN_FAILURE") {
      // Find order in database
      const dbOrder = await Order.findOne({
        "paymentDetails.paytmOrderId": ORDERID
      });

      if (dbOrder) {
        // Update order status to failed
        await Order.findByIdAndUpdate(
          dbOrder._id,
          {
            "paymentDetails.status": "failed",
            "paymentDetails.failureReason": RESPMSG || "Payment failed",
            "paymentDetails.responseCode": RESPCODE,
            "paymentDetails.responseMessage": RESPMSG,
          }
        );

        console.log(`Order ${ORDERID} payment failed via webhook`);
      }
    }

    // Respond to Paytm webhook
    return Response.json({ 
      message: "Webhook processed successfully",
      status: STATUS 
    });

  } catch (error) {
    console.error("Paytm webhook processing error:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}