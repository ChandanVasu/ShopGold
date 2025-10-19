// app/api/payment/stripe-intent/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

// MongoDB Schema for Settings
const SettingsSchema = new mongoose.Schema({}, { strict: false, collection: "settings" });
const Settings = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);

export async function POST(request) {
  try {
    const { amount, currency, customer } = await request.json();

    if (!amount || !currency || !customer?.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch payment settings from database
    await dbConnect();
    const paymentSettings = await Settings.findOne({ type: "payment" });

    if (!paymentSettings || !paymentSettings.stripe?.enabled || !paymentSettings.stripe?.secretKey) {
      return NextResponse.json({ error: "Stripe payment gateway not configured" }, { status: 400 });
    }

    // Initialize Stripe with admin-configured key
    const stripe = new Stripe(paymentSettings.stripe.secretKey, {
      apiVersion: "2023-08-16",
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
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
    return NextResponse.json({ error: "Failed to create payment intent", details: error.message }, { status: 500 });
  }
}
