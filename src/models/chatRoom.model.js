import mongoose from "mongoose";
export default mongoose.model(
  "ChatRoom",
  new mongoose.Schema(
    {
      name: { type: String, required: true },
      city: { type: String, required: true, index: true },
      locality: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true },
  ),
);
