import mongoose from "mongoose";

export default mongoose.model(
  "ClusterRole",
  new mongoose.Schema({
    name: { type: String, unique: true },
    rules: Array,
    createdAt: { type: Date, default: Date.now }
  })
);
