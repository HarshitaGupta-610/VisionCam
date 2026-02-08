import mongoose from "mongoose";

const emergencyEventSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true, // ✅ keep required
  },

  type: {
    type: String,
    default: "AUTO_ALERT",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model(
  "EmergencyEvent",
  emergencyEventSchema
);

