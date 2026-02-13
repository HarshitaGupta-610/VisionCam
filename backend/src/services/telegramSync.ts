import axios from "axios";
import TelegramUser from "../models/TelegramUser";

const BOT = process.env.BOT_TOKEN!;

let lastUpdateId = 0;

function normalizePhone(value: string) {
  return value.replace(/[^0-9+]/g, "");
}

function extractPhoneFromText(text?: string) {
  if (!text) return undefined;
  const match = text.match(/\+?\d{8,15}/);
  return match ? match[0] : undefined;
}

export async function syncTelegramUsers() {
  try {

    const res = await axios.get(
      `https://api.telegram.org/bot${BOT}/getUpdates`,
      {
        params: {
          offset: lastUpdateId + 1,
          timeout: 10
        }
      }
    );

    const updates = res.data.result;

    if (!updates.length) return;

    for (const update of updates) {

      lastUpdateId = update.update_id;

      const msg = update.message;
      if (!msg) continue;

      const chatId = String(msg.chat.id);
      const firstName = msg.chat.first_name || "Unknown";
      const username = msg.chat.username;
      const phone = msg.contact?.phone_number || extractPhoneFromText(msg.text);

      console.log("Saving user:", chatId, firstName); // DEBUG

      const update: Record<string, string> = {
        chatId,
        firstName,
      };

      if (username) update.username = username;
      if (phone) update.phone = normalizePhone(phone);

      await TelegramUser.updateOne(
        { chatId },
        { $set: update },
        { upsert: true }
      );
    }

  } catch (err:any) {

    console.log("❌ Telegram sync failed");

    console.log(
      err.response?.data || err.message
    );
  }
}
