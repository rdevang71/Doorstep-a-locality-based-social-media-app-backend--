import mongoose from "mongoose";
export default mongoose.model(
  "Event",
  new mongoose.Schema(
    {
      organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      title: { type: String, required: true },
      description: String,
      city: { type: String, required: true, index: true },
      locality: String,
      venue: String,
      startsAt: { type: Date, required: true, index: true },
      endsAt: Date,
      image: String,
      attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true },
  ),
);
