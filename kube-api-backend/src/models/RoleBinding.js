import mongoose from "mongoose";

export default mongoose.model(
  "RoleBinding",
  new mongoose.Schema({
    name: String,
    namespace: String,
    roleRef: Object,
    subjects: Array
  })
);
