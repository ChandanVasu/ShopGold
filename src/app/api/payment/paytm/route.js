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

// Helper function to generate Paytm checksum (basic implementation)
// Note: In production, use the official Paytm checksum library
// const generatePaytmChecksum = (data, key) => {
//   const string = Object.keys(data).sort().map(k => `${k}=${data[k]}`).join('&');
//   return crypto.createHmac('sha256', key).update(string).digest('hex');
// };

// POST: Create Paytm order
export async function POST(req) {
  try {
    await dbConnect();

    const { amount, currency, orderData } = await req.json();
    
    if (!amount || !orderData) {
      return Response.json({ error: "Amount and order data are required" }, { status: 400 });
    }

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.paytm?.enabled) {
      return Response.json({ error: "Paytm is not enabled" }, { status: 400 });
    }

    if (!paymentSettings.paytm.merchantId || !paymentSettings.paytm.merchantKey) {
      return Response.json({ error: "Paytm credentials not configured" }, { status: 400 });
    }

    // Create order ID
    const orderId = `ORDER_${Date.now()}`;
    
    // Create order in database first
    const order = await Order.create({
      ...orderData,
      paymentGateway: "paytm",
      paymentDetails: {
        orderId: orderId,
        amount: amount,
        currency: currency || "INR",
        status: "pending",
      },
    });

    // Paytm API URL
    const paytmUrl = paymentSettings.paytm.mode === "production"
      ? "https://securegw.paytm.in/theia/api/v1/initiateTransaction"
      : "https://securegw-stage.paytm.in/theia/api/v1/initiateTransaction";

    // Prepare request body for Paytm
    const requestBody = {
      body: {
        requestType: "Payment",
        mid: paymentSettings.paytm.merchantId,
        websiteName: paymentSettings.paytm.website || "WEBSTAGING",
        orderId: orderId,
        txnAmount: {
          value: amount.toString(),
          currency: currency || "INR"
        },
        userInfo: {
          custId: orderData.email || `customer_${Date.now()}`,
          email: orderData.email,
          firstName: orderData.name.split(" ")[0] || "Customer",
          lastName: orderData.name.split(" ").slice(1).join(" ") || "",
          mobile: orderData.phone || "",
        },
        callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/payment/paytm/callback`,
      }
    };

    // Generate checksum
    const bodyString = JSON.stringify(requestBody.body);
    const checksum = crypto
      .createHash('sha256')
      .update(bodyString + paymentSettings.paytm.merchantKey)
      .digest('hex');

    // Make API call to Paytm
    const response = await fetch(paytmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...requestBody,
        head: {
          signature: checksum
        }
      })
    });

    const paytmResponse = await response.json();

    if (paytmResponse.body.resultInfo.resultStatus === "S") {
      const paytmFormUrl = paymentSettings.paytm.mode === "production"
        ? "https://securegw.paytm.in/theia/api/v1/showPaymentPage"
        : "https://securegw-stage.paytm.in/theia/api/v1/showPaymentPage";

      return Response.json({
        success: true,
        paytmUrl: paytmFormUrl,
        orderId: orderId,
        txnToken: paytmResponse.body.txnToken,
        amount: amount,
        mid: paymentSettings.paytm.merchantId,
        dbOrderId: order._id,
      });
    } else {
      return Response.json({ error: "Failed to create Paytm payment" }, { status: 400 });
    }

  } catch (error) {
    console.error("Paytm order creation error:", error);
    return Response.json({ error: "Failed to create Paytm order" }, { status: 500 });
  }
}

// PUT: Verify Paytm payment
export async function PUT(req) {
  try {
    await dbConnect();

    const { orderId, dbOrderId } = await req.json();

    if (!orderId || !dbOrderId) {
      return Response.json({ error: "Missing payment verification data" }, { status: 400 });
    }

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.paytm?.merchantId || !paymentSettings?.paytm?.merchantKey) {
      return Response.json({ error: "Paytm credentials not configured" }, { status: 400 });
    }

    // Paytm status check URL
    const statusUrl = paymentSettings.paytm.mode === "production"
      ? "https://securegw.paytm.in/v3/order/status"
      : "https://securegw-stage.paytm.in/v3/order/status";

    // Prepare request for status check
    const statusRequestBody = {
      body: {
        mid: paymentSettings.paytm.merchantId,
        orderId: orderId
      }
    };

    // Generate checksum for status check
    const statusBodyString = JSON.stringify(statusRequestBody.body);
    const statusChecksum = crypto
      .createHash('sha256')
      .update(statusBodyString + paymentSettings.paytm.merchantKey)
      .digest('hex');

    // Check payment status
    const statusResponse = await fetch(statusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...statusRequestBody,
        head: {
          signature: statusChecksum
        }
      })
    });

    const statusData = await statusResponse.json();

    if (statusData.body.resultInfo.resultStatus === "TXN_SUCCESS") {
      // Update order in database
      const updatedOrder = await Order.findByIdAndUpdate(
        dbOrderId,
        {
          "paymentDetails.paytmTxnId": statusData.body.txnId,
          "paymentDetails.status": "completed",
          "paymentDetails.paidAt": new Date(),
          "paymentDetails.paytmStatus": statusData.body.resultInfo.resultStatus,
          "paymentDetails.gatewayName": statusData.body.gatewayName,
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
    console.error("Paytm payment verification error:", error);
    return Response.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}