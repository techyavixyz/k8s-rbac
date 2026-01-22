// models/Role.js
import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema({
  name: String,
  namespace: String, // null for ClusterRole
  rules: Array,
  type: { type: String, enum: ["Role", "ClusterRole"] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Role", RoleSchema);
