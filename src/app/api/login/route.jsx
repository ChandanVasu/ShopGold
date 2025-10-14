import { NextResponse } from "next/server";
import { SignJWT } from "jose";

// Default credentials (replace with environment-secured credentials in production)
const DEFAULT_EMAIL = process.env.LOGIN_EMAIL || "login@example.com";
const DEFAULT_PASSWORD = process.env.LOGIN_PASSWORD || "123456";

// Secret key for JWT (should be stored in .env)
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "shopead-secret");

// Function to create JWT
async function generateJWT(payload) {
  return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1d").sign(secret);
}

// POST = Login
export async function POST(request) {
  const { email, password } = await request.json();

  if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
    const token = await generateJWT({ email });

    const response = NextResponse.json({ message: "Login successful" });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}

// DELETE = Logout
// DELETE = Logout
export async function DELETE() {
  const response = NextResponse.json({ message: "Logged out" });

  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0, // Expire immediately
  });

  return response;
}
