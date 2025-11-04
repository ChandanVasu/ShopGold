import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// Admin User Schema
const AdminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: "Admin" },
    role: { type: String, default: "admin" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

if (mongoose.models.AdminUser) {
  delete mongoose.models.AdminUser;
}

const AdminUser = mongoose.model("AdminUser", AdminUserSchema);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Find admin user
    let adminUser = await AdminUser.findOne({ email });
    
    // If no admin user exists, create default one
    if (!adminUser) {
      adminUser = await AdminUser.create({
        email: "admin@gmail.com",
        password: "123456",
        name: "Admin",
        role: "admin",
      });
    }

    // Simple password comparison (no hashing)
    if (email === adminUser.email && password === adminUser.password) {
      // Generate JWT token
      const token = jwt.sign(
        {
          userId: adminUser._id,
          email: adminUser.email,
          role: adminUser.role,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Create response
      const response = Response.json({
        success: true,
        message: "Login successful",
        user: {
          id: adminUser._id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
        },
      });

      // Set HTTP-only cookie with production-safe settings
      const isProduction = process.env.NODE_ENV === "production";
      response.headers.set(
        "Set-Cookie",
        `auth_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict${isProduction ? "; Secure" : ""}`
      );

      return response;
    } else {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
