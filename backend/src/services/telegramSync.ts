import axios from "axios";
import TelegramUser from "../models/TelegramUser";

const BOT = process.env.BOT_TOKEN;

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
  if (!BOT) {
    return;
  }

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

    for (const tgUpdate of updates) {

      if (typeof tgUpdate.update_id === "number") {
        lastUpdateId = tgUpdate.update_id;
      }

      const msg = tgUpdate.message;
      if (!msg) continue;

      const chatId = String(msg.chat.id);
      const firstName = msg.chat.first_name || "Unknown";
      const username = msg.chat.username;
      const phone = msg.contact?.phone_number || extractPhoneFromText(msg.text);

      console.log("Saving user:", chatId, firstName); // DEBUG

      const updateDoc: Record<string, string> = {
        chatId,
        firstName,
      };

      if (username) updateDoc.username = username;
      if (phone) updateDoc.phone = normalizePhone(phone);

      await TelegramUser.updateOne(
        { chatId },
        { $set: updateDoc },
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
