import mongoose from "mongoose";
export default mongoose.model(
  "Message",
  new mongoose.Schema(
    {
      room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatRoom",
        required: true,
        index: true,
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      content: { type: String, required: true, maxlength: 1000 },
    },
    { timestamps: true },
  ),
);
