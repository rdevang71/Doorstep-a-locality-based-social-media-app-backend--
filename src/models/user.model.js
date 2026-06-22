import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: String,
    bio: { type: String, maxlength: 240 },
    city: { type: String, required: true, index: true, trim: true },
    locality: { type: String, required: true, index: true, trim: true },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: [/^[1-9][0-9]{5}$/, "Pincode must be a valid 6-digit Indian PIN code"],
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "business", "community", "moderator", "admin"],
      default: "user",
    },
  },
  { timestamps: true },
);
schema.index({ pincode: 1, locality: 1 });
schema.pre("save", async function (next) {
  if (this.isModified("password"))
    this.password = await bcrypt.hash(this.password, 12);
  next();
});
schema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};
export default mongoose.model("User", schema);
