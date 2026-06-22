import mongoose from "mongoose";
export default mongoose.model(
  "Report",
  new mongoose.Schema(
    {
      reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      targetType: {
        type: String,
        enum: ["post", "user", "business", "community"],
        required: true,
      },
      targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
      reason: { type: String, required: true },
      details: String,
      status: {
        type: String,
        enum: ["open", "reviewing", "resolved", "dismissed"],
        default: "open",
        index: true,
      },
      moderatorNote: String,
    },
    { timestamps: true },
  ),
);
