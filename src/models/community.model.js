import mongoose from "mongoose";
export default mongoose.model(
  "Community",
  new mongoose.Schema(
    {
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: { type: String, required: true },
      description: String,
      city: { type: String, required: true, index: true },
      locality: String,
      isPrivate: { type: Boolean, default: false },
      members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      joinRequests: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          requestedAt: { type: Date, default: Date.now },
        },
      ],
    },
    { timestamps: true },
  ),
);
