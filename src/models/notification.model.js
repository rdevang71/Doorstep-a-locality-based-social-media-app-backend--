import mongoose from "mongoose";
export default mongoose.model(
  "Notification",
  new mongoose.Schema(
    {
      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      type: { type: String, required: true },
      message: { type: String, required: true },
      link: String,
      read: { type: Boolean, default: false },
    },
    { timestamps: true },
  ),
);
