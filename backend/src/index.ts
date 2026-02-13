import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { connectDB, UserModel } from "./db";
import TelegramUser from "./models/TelegramUser";
import EmergencyContact from "./models/EmergencyContact";
import EmergencyEvent from "./models/EmergencyEvent";
import Warning from "./models/Warning";

import emergencyRoutes from "./routes/emergencyRoutes";
import { syncTelegramUsers } from "./services/telegramSync";
import { sendTelegramAlert } from "./services/telegramService";




//////////////////////////////////////////////////////

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/v1", emergencyRoutes);

connectDB();

function normalizePhone(value: string) {
  return value.replace(/[^0-9+]/g, "");
}

//////////////////////////////////////////////////////
// 🔐 SAFEST SECRET CHECK
//////////////////////////////////////////////////////

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET missing in .env");
}

//////////////////////////////////////////////////////
// 🧠 WARNING MEMORY (SUPER FAST)
//////////////////////////////////////////////////////

const warningMap = new Map<
  string,
  { count: number; firstWarningTime: number }
>();

//////////////////////////////////////////////////////
//////////////////// SIGNUP //////////////////////////
//////////////////////////////////////////////////////

app.post("/api/v1/signup", async (req: Request, res: Response) => {
  const schema = z.object({
    username: z.string(),
    age: z.number(),
    gender: z.string(),
    phone: z.string(),
    emergencyname: z.string(),
    emergencyphone: z.string(),
    password: z.string(),
  });

  const parsed = schema.safeParse({
    ...req.body,
    age: Number(req.body.age),
  });

  if (!parsed.success)
    return res.status(400).json({ message: "Invalid data" });

  const data = parsed.data;

  try {
    const normalizedEmergencyPhone = normalizePhone(data.emergencyphone);

    // Prefer phone match when the contact has shared it with the bot
    let tgUser = await TelegramUser.findOne({
      phone: normalizedEmergencyPhone,
    });

    if (!tgUser) {
      // Fallback: case-insensitive name match
      tgUser = await TelegramUser.findOne({
        firstName: new RegExp(`^${data.emergencyname}$`, "i"),
      });
    }

    if (!tgUser)
      return res.status(400).json({
        message: "Emergency contact must message bot first",
      });

    const hashed = await bcrypt.hash(data.password, 5);

    const newUser = await UserModel.create({
      ...data,
      password: hashed,
    });

    await EmergencyContact.create({
      userId: newUser._id.toString(),
      name: data.emergencyname,
      phone: data.emergencyphone,
      chatId: tgUser.chatId,
    });

    res.json({ message: "Signup successful ✅" });
  } catch {
    res.status(409).json({ message: "User exists" });
  }
});

//////////////////////////////////////////////////////
//////////////////// SIGNIN //////////////////////////
//////////////////////////////////////////////////////

app.post("/api/v1/signin", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await UserModel.findOne({ username });

  if (!user)
    return res.status(403).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password as string);

  if (!match)
    return res.status(403).json({ message: "Wrong password" });

  const token = jwt.sign(
    { id: user._id },
    JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

//////////////////////////////////////////////////////
//////////////// PROFILE (signed-in user) /////////////
//////////////////////////////////////////////////////

app.get("/api/v1/profile", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "Token missing" });
  const token = authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "Invalid token" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as { id: string };
    const user = await UserModel.findById(decoded.id).lean();
    if (!user)
      return res.status(404).json({ message: "User not found" });
    const { password: _, ...profile } = user as Record<string, unknown> & { password?: string };
    return res.json(profile);
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

//////////////////////////////////////////////////////
//////////////// EVENTS (warnings for this user) //////
//////////////////////////////////////////////////////

app.get("/api/v1/events", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "Token missing" });
  const token = authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "Invalid token" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as { id: string };
    const userId = decoded.id;
    const [emergencyEvents, warnings] = await Promise.all([
      EmergencyEvent.find({ userId }).sort({ createdAt: -1 }).lean(),
      Warning.find({ userId }).sort({ createdAt: -1 }).lean(),
    ]);
    const fromEmergency = emergencyEvents.map((e: { _id: unknown; type: string; createdAt: Date }) => ({
      _id: e._id,
      type: e.type === "MANUAL_ALERT" ? "call" : "warning",
      conditions: e.type === "MANUAL_ALERT" ? ["Emergency call triggered"] : ["Unsafe driving detected"],
      count: 1,
      createdAt: e.createdAt,
    }));
    const fromWarnings = warnings.map((w: { _id: unknown; createdAt: Date }) => ({
      _id: w._id,
      type: "warning",
      conditions: ["Unsafe driving detected"],
      count: 1,
      createdAt: w.createdAt,
    }));
    const combined = [...fromEmergency, ...fromWarnings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return res.json(combined);
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

//////////////////////////////////////////////////////
//////////////// WARNING ROUTE ///////////////////////
//////////////////////////////////////////////////////

app.post("/api/v1/warning", async (req: Request, res: Response) => {

  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ message: "Token missing" });

  const token = authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Invalid token" });

  try {

    const decoded = jwt.verify(token, JWT_SECRET as string) as {
      id: string;
    };

    const user = await UserModel.findById(decoded.id);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const userId = user._id.toString();
    const now = Date.now();

    /////////////////////////////////////////////
    // WARNING LOGIC
    /////////////////////////////////////////////

    if (!warningMap.has(userId)) {
      warningMap.set(userId, {
        count: 1,
        firstWarningTime: now,
      });
    } else {

      const data = warningMap.get(userId)!;

      // reset after 5 minutes
      if (now - data.firstWarningTime > 5 * 60 * 1000) {
        warningMap.set(userId, {
          count: 1,
          firstWarningTime: now,
        });
      } else {
        data.count++;
        warningMap.set(userId, data);
      }
    }

    const current = warningMap.get(userId)!;

    await Warning.create({ userId });

    /////////////////////////////////////////////
    // 🔥 CONSOLE LOG
    /////////////////////////////////////////////

    console.log(
      `⚠️ WARNING for ${user.username} -> ${current.count}/4`
    );

    /////////////////////////////////////////////
    // 🚨 SEND TELEGRAM
    /////////////////////////////////////////////

    if (current.count >= 4) {

      const contacts = await EmergencyContact.find({ userId });

      const chatIds = contacts.map(c => c.chatId);

      const message = `🚨 VISIONCAM ALERT

Driver: ${user.username}
Phone: ${user.phone}

⚠️ Driver is UNSAFE!
4 warnings detected within 5 minutes.

Please check immediately.`;

      await sendTelegramAlert(chatIds, message);

      await EmergencyEvent.create({
        userId,
        type: "AUTO_ALERT",
      });

      console.log("🚨🚨🚨 TELEGRAM ALERT SENT 🚨🚨🚨");

      // reset counter
      warningMap.delete(userId);
    }

    res.json({
      success: true,
      warnings: current.count,
    });

  } catch (err) {

    console.log("Warning error:", err);

    res.status(500).json({
      message: "Warning failed",
    });
  }
});

//////////////////////////////////////////////////////

app.use("/api/v1/emergency", emergencyRoutes);

//////////////////////////////////////////////////////
// TELEGRAM SYNC
//////////////////////////////////////////////////////

setInterval(syncTelegramUsers, 15000);

//////////////////////////////////////////////////////

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
