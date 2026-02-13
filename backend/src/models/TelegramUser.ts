import mongoose from "mongoose";

const telegramUserSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: String,
  username: String,
  phone: String,
});

export default mongoose.model(
  "TelegramUser",
  telegramUserSchema
);
