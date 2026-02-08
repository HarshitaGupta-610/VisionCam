import axios from "axios";

const BOT = process.env.BOT_TOKEN!;

export async function sendTelegramAlert(
  chatIds: string[],
  message: string
) {
  for (const chatId of chatIds) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${BOT}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
        }
      );

      console.log("✅ Alert sent to:", chatId);

    } catch (err:any) {

      console.log("❌ Telegram send error:");

      console.log(
        err.response?.data || err.message
      );
    }
  }
}
