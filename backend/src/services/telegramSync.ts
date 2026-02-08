import axios from "axios";
import TelegramUser from "../models/TelegramUser";

const BOT = process.env.BOT_TOKEN!;

let lastUpdateId = 0;

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

      console.log("Saving user:", chatId, firstName); // DEBUG

      await TelegramUser.updateOne(
        { chatId },
        { chatId, firstName },
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
