import mongoose from "mongoose";

export default mongoose.model(
  "AuditLog",
  new mongoose.Schema({
    action: {
      type: String,
      required: true
    },

    entityType: {
      type: String,
      required: true
    },

    entityId: {
      type: String,
      required: true
    },

    // Who performed the action (future: JWT user)
    actor: {
      type: String,
      default: "system"
    },

    // Any extra info (groups, namespace, etc.)
    metadata: {
      type: Object
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  })
);
