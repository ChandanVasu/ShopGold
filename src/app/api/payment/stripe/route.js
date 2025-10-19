// app/api/payment/stripe-intent/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// MongoDB Schema for Settings with _id as String
const SettingsSchema = new mongoose.Schema({ _id: { type: String } }, { strict: false, collection: "store-settings", versionKey: false, timestamps: true });

// Clear existing model to prevent conflicts
if (mongoose.models["store-settings"]) {
  delete mongoose.models["store-settings"];
}

const Settings = mongoose.model("store-settings", SettingsSchema, "store-settings");

export async function POST(request) {
  try {
    const { amount, currency, customer } = await request.json();

    if (!amount || !currency || !customer?.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch payment settings from database
    await dbConnect();
    const paymentSettings = await Settings.findOne({ _id: "payment" });

    console.log("Payment Settings:", JSON.stringify(paymentSettings, null, 2));
    console.log("Stripe Enabled:", paymentSettings?.stripe?.enabled);
    console.log("Stripe Secret Key:", paymentSettings?.stripe?.secretKey ? "Present" : "Missing");

    if (!paymentSettings || !paymentSettings.stripe?.enabled || !paymentSettings.stripe?.secretKey) {
      return NextResponse.json(
        {
          error: "Stripe payment gateway not configured",
          debug: {
            settingsFound: !!paymentSettings,
            stripeEnabled: paymentSettings?.stripe?.enabled,
            secretKeyPresent: !!paymentSettings?.stripe?.secretKey,
          },
        },
        { status: 400 }
      );
    }

    // Initialize Stripe with admin-configured key
    const stripe = new Stripe(paymentSettings.stripe.secretKey, {
      apiVersion: "2023-08-16",
    });

    console.log("Creating payment intent with:", {
      amount: Math.round(amount * 100),
      currency,
      email: customer.email,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      receipt_email: customer.email,
      metadata: {
        integration_check: "custom_card_payment",
      },
      payment_method_options: {
        card: {
          request_three_d_secure: "any",
        },
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe Payment Intent Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create payment intent",
        details: error.message,
        type: error.type,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
