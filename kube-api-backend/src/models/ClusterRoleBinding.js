import mongoose from "mongoose";

export default mongoose.model(
  "ClusterRoleBinding",
  new mongoose.Schema({
    name: { type: String, unique: true },
    roleRef: Object,
    subjects: Array,
    createdAt: { type: Date, default: Date.now }
  })
);
