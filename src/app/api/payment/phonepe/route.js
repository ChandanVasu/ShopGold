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

function generatePhonePeHash(payload, endpoint, saltKey, saltIndex) {
  const string = payload + endpoint + saltKey;
  const sha256 = crypto.createHash("sha256").update(string).digest("hex");
  return sha256 + "###" + saltIndex;
}

// POST: Create PhonePe order
export async function POST(req) {
  try {
    await dbConnect();

    const { amount, currency, orderData } = await req.json();
    
    if (!amount || !orderData) {
      return Response.json({ error: "Amount and order data are required" }, { status: 400 });
    }

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.phonepe?.enabled) {
      return Response.json({ error: "PhonePe is not enabled" }, { status: 400 });
    }

    if (!paymentSettings.phonepe.merchantId || !paymentSettings.phonepe.saltKey || !paymentSettings.phonepe.saltIndex) {
      return Response.json({ error: "PhonePe credentials not configured" }, { status: 400 });
    }

    // Create transaction ID
    const transactionId = `TXN_${Date.now()}`;
    
    // Create order in database first
    const order = await Order.create({
      ...orderData,
      paymentGateway: "phonepe",
      paymentDetails: {
        transactionId: transactionId,
        amount: amount,
        currency: currency || "INR",
        status: "pending",
      },
    });

    // PhonePe API URLs
    const baseUrl = paymentSettings.phonepe.mode === "production" 
      ? "https://api.phonepe.com/apis/hermes/pg/v1/pay"
      : "https://api-preprod.phonepe.com/apis/hermes/pg/v1/pay";

    // Prepare PhonePe payload
    const paymentPayload = {
      merchantId: paymentSettings.phonepe.merchantId,
      merchantTransactionId: transactionId,
      merchantUserId: orderData.email || `user_${Date.now()}`,
      amount: Math.round(amount * 100), // Convert to paise
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/success?gateway=phonepe&txnId=${transactionId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/payment/phonepe/callback`,
      mobileNumber: orderData.phone || "",
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    // Convert payload to base64
    const payloadBase64 = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
    
    // Generate X-VERIFY header
    const xVerify = generatePhonePeHash(
      payloadBase64, 
      "/pg/v1/pay", 
      paymentSettings.phonepe.saltKey, 
      paymentSettings.phonepe.saltIndex
    );

    // Make API call to PhonePe
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
      },
      body: JSON.stringify({
        request: payloadBase64
      })
    });

    const phonePeResponse = await response.json();

    if (phonePeResponse.success) {
      return Response.json({
        success: true,
        redirectUrl: phonePeResponse.data.instrumentResponse.redirectInfo.url,
        transactionId: transactionId,
        dbOrderId: order._id,
      });
    } else {
      return Response.json({ error: "Failed to create PhonePe payment" }, { status: 400 });
    }

  } catch (error) {
    console.error("PhonePe order creation error:", error);
    return Response.json({ error: "Failed to create PhonePe order" }, { status: 500 });
  }
}

// PUT: Verify PhonePe payment
export async function PUT(req) {
  try {
    await dbConnect();

    const { transactionId, dbOrderId } = await req.json();

    if (!transactionId || !dbOrderId) {
      return Response.json({ error: "Missing payment verification data" }, { status: 400 });
    }

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.phonepe?.merchantId || !paymentSettings?.phonepe?.saltKey) {
      return Response.json({ error: "PhonePe credentials not configured" }, { status: 400 });
    }

    // PhonePe status check URL
    const statusUrl = paymentSettings.phonepe.mode === "production" 
      ? `https://api.phonepe.com/apis/hermes/pg/v1/status/${paymentSettings.phonepe.merchantId}/${transactionId}`
      : `https://api-preprod.phonepe.com/apis/hermes/pg/v1/status/${paymentSettings.phonepe.merchantId}/${transactionId}`;

    // Generate X-VERIFY for status check
    const statusEndpoint = `/pg/v1/status/${paymentSettings.phonepe.merchantId}/${transactionId}`;
    const xVerify = generatePhonePeHash(
      "",
      statusEndpoint,
      paymentSettings.phonepe.saltKey,
      paymentSettings.phonepe.saltIndex
    );

    // Check payment status
    const statusResponse = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": paymentSettings.phonepe.merchantId,
      }
    });

    const statusData = await statusResponse.json();

    if (statusData.success && statusData.data.state === "COMPLETED") {
      // Update order in database
      const updatedOrder = await Order.findByIdAndUpdate(
        dbOrderId,
        {
          "paymentDetails.phonePeTransactionId": statusData.data.transactionId,
          "paymentDetails.status": "completed",
          "paymentDetails.paidAt": new Date(),
          "paymentDetails.paymentState": statusData.data.state,
          "paymentDetails.responseCode": statusData.data.responseCode,
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
    } else {
      return Response.json({ error: "Payment not completed" }, { status: 400 });
    }

  } catch (error) {
    console.error("PhonePe payment verification error:", error);
    return Response.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}