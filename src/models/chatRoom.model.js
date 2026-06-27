import mongoose from "mongoose";
export default mongoose.model(
  "ChatRoom",
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true, maxlength: 80 },
      description: { type: String, trim: true, maxlength: 300 },
      avatar: String,
      roomCode: { type: String, required: true, unique: true, sparse: true, index: true },
      type: {
        type: String,
        enum: ["public", "private"],
        default: "public",
        index: true,
      },
      passwordHash: { type: String, select: false },
      city: { type: String, required: true, index: true },
      locality: String,
      community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
        index: true,
      },
      isCommunityRoom: { type: Boolean, default: false, index: true },
      isDirect: { type: Boolean, default: false, index: true },
      directMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      directKey: { type: String, unique: true, sparse: true, index: true },
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


