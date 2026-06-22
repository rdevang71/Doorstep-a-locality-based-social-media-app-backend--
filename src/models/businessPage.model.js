import mongoose from "mongoose";
export default mongoose.model(
  "BusinessPage",
  new mongoose.Schema(
    {
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: { type: String, required: true },
      description: String,
      category: String,
      city: { type: String, required: true, index: true },
      locality: String,
      logo: String,
      contact: String,
      followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true },
  ),
);
