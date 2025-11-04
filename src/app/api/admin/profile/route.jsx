import dbConnect from "@/lib/dbConnection";
import mongoose from "mongoose";

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

// GET: Get admin profile
export async function GET(req) {
  try {
    await dbConnect();
    
    // Get admin user (assuming only one admin user)
    let adminUser = await AdminUser.findOne({});
    
    // If no admin user exists, create default one
    if (!adminUser) {
      adminUser = await AdminUser.create({
        email: "admin@shopgold.com",
        password: "admin123",
        name: "Admin",
        role: "admin",
      });
    }
    
    // Return profile without password
    const { password, ...profile } = adminUser.toObject();
    return Response.json(profile);
    
  } catch (error) {
    console.error("Profile GET Error:", error);
    return Response.json({ error: "Failed to get profile" }, { status: 500 });
  }
}

// PUT: Update admin profile
export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, currentPassword, newPassword, name } = body;
    
    // Get current admin user
    const adminUser = await AdminUser.findOne({});
    if (!adminUser) {
      return Response.json({ error: "Admin user not found" }, { status: 404 });
    }
    
    // If updating password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return Response.json({ error: "Current password is required" }, { status: 400 });
      }
      
      // Simple string comparison
      if (currentPassword !== adminUser.password) {
        return Response.json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }
    
    // Prepare update data
    const updateData = {};
    
    if (email && email !== adminUser.email) {
      updateData.email = email;
    }
    
    if (newPassword) {
      updateData.password = newPassword;
    }
    
    if (name && name !== adminUser.name) {
      updateData.name = name;
    }
    
    // Update admin user
    const updatedUser = await AdminUser.findByIdAndUpdate(
      adminUser._id,
      updateData,
      { new: true }
    );
    
    // Return updated profile without password
    const { password, ...profile } = updatedUser.toObject();
    return Response.json({ 
      message: "Profile updated successfully",
      profile 
    });
    
  } catch (error) {
    console.error("Profile PUT Error:", error);
    
    if (error.code === 11000) {
      return Response.json({ error: "Email already exists" }, { status: 400 });
    }
    
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }
}