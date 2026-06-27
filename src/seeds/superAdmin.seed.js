import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/user.model.js";

const SUPER_ADMIN = {
  name: "Super Admin",
  email: "rdevang@gmail.com",
  password: "@Noorpur12",
  city: "Noorpur",
  locality: "Noorpur",
  pincode: "110001",
  role: "super_admin",
};

await connectDB();

const user = await User.findOne({ email: SUPER_ADMIN.email }).select("+password");
if (user) {
  user.name = SUPER_ADMIN.name;
  user.password = SUPER_ADMIN.password;
  user.city = SUPER_ADMIN.city;
  user.locality = SUPER_ADMIN.locality;
  user.pincode = SUPER_ADMIN.pincode;
  user.role = SUPER_ADMIN.role;
  await user.save();
  console.log(`Updated super admin: ${SUPER_ADMIN.email}`);
} else {
  await User.create(SUPER_ADMIN);
  console.log(`Created super admin: ${SUPER_ADMIN.email}`);
}

await mongoose.disconnect();
