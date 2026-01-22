import mongoose from "mongoose";

export default mongoose.model(
  "User",
  new mongoose.Schema({
    username: {
      type: String,
      unique: true,
      required: true
    },

    groups: [String],

    certPath: String,
    kubeconfigPath: String,

    // 🔐 User state
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active"
    },

    revokedAt: Date,

    createdAt: {
      type: Date,
      default: Date.now
    }
  })
);
