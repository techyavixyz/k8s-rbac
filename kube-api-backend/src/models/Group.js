import mongoose from "mongoose";

export default mongoose.model(
  "Group",
  new mongoose.Schema({
    name: {
      type: String,
      unique: true,
      required: true
    },

    // 🔑 REQUIRED — this was missing
    users: {
      type: [String],
      default: []
    },

    description: String,

    createdAt: {
      type: Date,
      default: Date.now
    }
  })
);
