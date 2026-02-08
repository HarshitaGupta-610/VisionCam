import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

import EmergencyContact from "../models/EmergencyContact";
import EmergencyEvent from "../models/EmergencyEvent";
import { sendTelegramAlert } from "../services/telegramService";
import { UserModel } from "../db";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

//////////////////////////////////////////////////////
// 🚨 SEND EMERGENCY ALERT
//////////////////////////////////////////////////////

router.post("/", async (req: Request, res: Response) => {

  /////////////////////////////////////////////////
  // GET TOKEN
  /////////////////////////////////////////////////

  const auth = req.headers.authorization;

  if (!auth) {
    return res.status(401).json({
      message: "Token missing",
    });
  }

  try {

    const token = auth.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    /////////////////////////////////////////////////
    // VERIFY TOKEN
    /////////////////////////////////////////////////

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
    };

    /////////////////////////////////////////////////
    // FIND USER
    /////////////////////////////////////////////////

    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    /////////////////////////////////////////////////
    // GET CONTACTS
    /////////////////////////////////////////////////

    const contacts = await EmergencyContact.find({
      userId: user._id.toString(),
    });

    if (!contacts.length) {
      return res.status(400).json({
        message: "No emergency contacts",
      });
    }

    /////////////////////////////////////////////////
    // CHAT IDS
    /////////////////////////////////////////////////

    const chatIds = contacts
      .map(c => c.chatId)
      .filter(Boolean) as string[];

    /////////////////////////////////////////////////
    // TELEGRAM MESSAGE
    /////////////////////////////////////////////////

    const message = `🚨 VISIONCAM ALERT

Driver: ${user.username}
Phone: ${user.phone}

⚠️ Unsafe driving detected!
Check immediately.`;

    await sendTelegramAlert(chatIds, message);

    /////////////////////////////////////////////////
    // SAVE EVENT
    /////////////////////////////////////////////////

    await EmergencyEvent.create({
      userId: user._id.toString(),
      type: "MANUAL_ALERT",
    });

    res.json({
      success: true,
      alerted: chatIds.length,
    });

  } catch (err) {

    console.log("Emergency error:", err);

    res.status(500).json({
      message: "Emergency failed",
    });
  }
});


export default router;
