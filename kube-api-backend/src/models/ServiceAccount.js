import mongoose from "mongoose";

export default mongoose.model(
  "ServiceAccount",
  new mongoose.Schema({
    name: String,
    namespace: String,
    token: String,
    kubeconfigPath: String,
    createdAt: { type: Date, default: Date.now }
  })
);
