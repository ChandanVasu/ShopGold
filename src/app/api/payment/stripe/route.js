// app/api/payment/stripe-intent/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

export async function POST(request) {
  try {
    const { amount, currency, customer } = await request.json();

    if (!amount || !currency || !customer?.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

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
