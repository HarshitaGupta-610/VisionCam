import EmergencyContact from "../models/EmergencyContact";
import EmergencyEvent from "../models/EmergencyEvent";
import { sendTelegramAlert } from "./telegramService";
import { UserModel } from "../db";

//////////////////////////////////////////////////////
// MEMORY STORE (FAST + PERFECT FOR HACKATHON)
//////////////////////////////////////////////////////

const warningMap = new Map<
  string,
  { count: number; firstWarningTime: number }
>();

//////////////////////////////////////////////////////

export async function processRisk(userId: string) {

  const now = Date.now();

  let record = warningMap.get(userId);

  /////////////////////////////////////////////////
  // FIRST WARNING
  /////////////////////////////////////////////////

  if (!record) {

    warningMap.set(userId, {
      count: 1,
      firstWarningTime: now,
    });

    console.log(`⚠️ WARNING 1 for user ${userId}`);

    return;
  }

  /////////////////////////////////////////////////
  // RESET AFTER 5 MIN
  /////////////////////////////////////////////////

  const FIVE_MIN = 5 * 60 * 1000;

  if (now - record.firstWarningTime > FIVE_MIN) {

    warningMap.set(userId, {
      count: 1,
      firstWarningTime: now,
    });

    console.log("🟢 Warning window reset");

    return;
  }

  /////////////////////////////////////////////////
  // INCREMENT
  /////////////////////////////////////////////////

  record.count++;

  console.log(`⚠️ WARNING ${record.count} for user ${userId}`);

  /////////////////////////////////////////////////
  // 🚨 TRIGGER ALERT
  /////////////////////////////////////////////////

  if (record.count >= 4) {

    console.log("🚨 4 WARNINGS → SENDING TELEGRAM");

    const user = await UserModel.findById(userId);

    if (!user) return;

    const contacts = await EmergencyContact.find({
      userId,
    });

    const chatIds = contacts.map(c => c.chatId);

    const message = `🚨 VISIONCAM CRITICAL ALERT

Driver: ${user.username}
Phone: ${user.phone}

⚠️ Driver showed dangerous behaviour 4 times within 5 minutes.

Immediate attention required.`;

    await sendTelegramAlert(chatIds, message);

    //////////////////////////////////////////////////
    // SAVE EVENT
    //////////////////////////////////////////////////

    await EmergencyEvent.create({
      userId,
      type: "AUTO_ALERT",
    });

    //////////////////////////////////////////////////
    // RESET
    //////////////////////////////////////////////////

    warningMap.delete(userId);

    console.log("✅ TELEGRAM ALERT SENT");
  }
}
