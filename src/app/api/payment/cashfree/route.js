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

// Generate Cashfree signature for API requests
function generateCashfreeSignature(postData, timestamp, appId, secretKey) {
  const signatureData = `${postData}${timestamp}`;
  return crypto.createHmac("sha256", secretKey).update(signatureData).digest("base64");
}

// Generate a valid customer_id from email (alphanumeric with underscores/hyphens)
function generateCustomerId(email) {
  if (!email) {
    return `customer_${Date.now()}`;
  }
  // Replace invalid characters with underscores and ensure it's alphanumeric
  return email
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50); // Limit length to 50 characters
}

// POST: Create Cashfree order using Payment Gateway API
export async function POST(req) {
  try {
    await dbConnect();

    const { amount, currency, orderData } = await req.json();
    
    if (!amount || !orderData) {
      return Response.json({ error: "Amount and order data are required" }, { status: 400 });
    }

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.cashfree?.enabled) {
      return Response.json({ error: "Cashfree is not enabled" }, { status: 400 });
    }

    if (!paymentSettings.cashfree.appId || !paymentSettings.cashfree.secretKey) {
      return Response.json({ error: "Cashfree credentials not configured" }, { status: 400 });
    }

    // Cashfree API URLs - Latest v5 (2025-01-01)
    const baseUrl = paymentSettings.cashfree.mode === "production" 
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

    // Create order ID
    const orderId = `order_${Date.now()}`;
    
    // Prepare Cashfree order payload
    const cashfreeOrderPayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: currency || "INR",
      customer_details: {
        customer_id: orderData.customerId || generateCustomerId(orderData.email),
        customer_name: orderData.name,
        customer_email: orderData.customerEmail || orderData.email,
        customer_phone: orderData.phone || "9999999999",
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/success?gateway=cashfree&order_id=${orderId}`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/payment/cashfree/webhook`,
      },
    };

    // Generate signature for Cashfree API
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const postData = JSON.stringify(cashfreeOrderPayload);
    const cfSignature = generateCashfreeSignature(
      postData, 
      timestamp, 
      paymentSettings.cashfree.appId, 
      paymentSettings.cashfree.secretKey
    );

    // Make API call to Cashfree
    const response = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2025-01-01",
        "x-client-id": paymentSettings.cashfree.appId,
        "x-client-secret": paymentSettings.cashfree.secretKey,
        "x-request-id": `req_${Date.now()}`,
        "x-cf-signature": cfSignature,
        "x-timestamp": timestamp,
      },
      body: postData,
    });

    const cashfreeResponse = await response.json();

    if (response.ok && cashfreeResponse.order_status === "ACTIVE") {
      // Create order in database
      const order = await Order.create({
        ...orderData,
        paymentGateway: "cashfree",
        paymentDetails: {
          orderId: orderId,
          cfOrderId: cashfreeResponse.cf_order_id,
          amount: amount,
          currency: currency || "INR",
          status: "pending",
          orderToken: cashfreeResponse.order_token,
          paymentSessionId: cashfreeResponse.payment_session_id,
        },
      });

      return Response.json({
        success: true,
        orderId: orderId,
        cfOrderId: cashfreeResponse.cf_order_id,
        paymentSessionId: cashfreeResponse.payment_session_id,
        orderToken: cashfreeResponse.order_token,
        amount: amount,
        currency: currency || "INR",
        dbOrderId: order._id,
        // For checkout.js integration
        checkoutUrl: `${baseUrl}/checkout/hosted?order_token=${cashfreeResponse.order_token}`,
      });
    } else {
      console.error("Cashfree order creation failed:", cashfreeResponse);
      return Response.json({ 
        error: cashfreeResponse.message || "Failed to create Cashfree order" 
      }, { status: 400 });
    }

  } catch (error) {
    console.error("Cashfree order creation error:", error);
    return Response.json({ error: "Failed to create Cashfree order" }, { status: 500 });
  }
}

// PUT: Verify Cashfree payment using Payment Gateway API
export async function PUT(req) {
  try {
    await dbConnect();

    const { orderId, dbOrderId } = await req.json();

    if (!orderId || !dbOrderId) {
      return Response.json({ error: "Missing order verification data" }, { status: 400 });
    }

    // Get payment settings
    const paymentSettings = await getPaymentSettings();
    
    if (!paymentSettings?.cashfree?.appId || !paymentSettings?.cashfree?.secretKey) {
      return Response.json({ error: "Cashfree credentials not configured" }, { status: 400 });
    }

    // Cashfree API URLs
    const baseUrl = paymentSettings.cashfree.mode === "production" 
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

    // Get order status from Cashfree
    const response = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2025-01-01",
        "x-client-id": paymentSettings.cashfree.appId,
        "x-client-secret": paymentSettings.cashfree.secretKey,
        "x-request-id": `req_${Date.now()}`,
      },
    });

    const orderStatus = await response.json();

    if (response.ok && orderStatus.order_status === "PAID") {
      // Get payment details
      const paymentsResponse = await fetch(`${baseUrl}/orders/${orderId}/payments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2025-01-01",
          "x-client-id": paymentSettings.cashfree.appId,
          "x-client-secret": paymentSettings.cashfree.secretKey,
          "x-request-id": `req_${Date.now()}`,
        },
      });

      const paymentsData = await paymentsResponse.json();
      const payment = paymentsData[0]; // Get first payment

      // Update order in database
      const updatedOrder = await Order.findByIdAndUpdate(
        dbOrderId,
        {
          "paymentDetails.cfTransactionId": payment?.cf_payment_id,
          "paymentDetails.status": "completed",
          "paymentDetails.paidAt": new Date(),
          "paymentDetails.orderStatus": orderStatus.order_status,
          "paymentDetails.paymentMethod": payment?.payment_method,
          "paymentDetails.bankReference": payment?.bank_reference,
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
      return Response.json({ 
        error: `Payment not completed. Status: ${orderStatus.order_status}` 
      }, { status: 400 });
    }

  } catch (error) {
    console.error("Cashfree payment verification error:", error);
    return Response.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}