import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
    images: [String],
    type: {
      type: String,
      enum: ["general", "need", "offer", "event", "alert"],
      default: "general",
      index: true,
    },
    city: { type: String, required: true, trim: true, index: true },
    locality: { type: String, required: true, trim: true, index: true },
    pincode: {
      type: String,
      trim: true,
      match: [/^[1-9][0-9]{5}$/, "Pincode must be a valid 6-digit Indian PIN code"],
      index: true,
    },
    hashtags: [{ type: String, lowercase: true, index: true }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);
schema.index({ city: 1, locality: 1, createdAt: -1 });
schema.index({ pincode: 1, createdAt: -1 });
export default mongoose.model("Post", schema);
