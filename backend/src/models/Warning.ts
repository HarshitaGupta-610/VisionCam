import mongoose from "mongoose";

const warningSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Warning", warningSchema);
