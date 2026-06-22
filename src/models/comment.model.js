import mongoose from "mongoose";
export default mongoose.model(
  "Comment",
  new mongoose.Schema(
    {
      post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
        index: true,
      },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      content: { type: String, required: true, maxlength: 1000 },
    },
    { timestamps: true },
  ),
);
