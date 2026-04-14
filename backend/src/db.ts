import mongoose from "mongoose";

export const connectDB = async () => {

  const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!mongoUri) {
    throw new Error("Missing MONGO_URI/DATABASE_URL in environment");
  }

  await mongoose.connect(mongoUri);

  console.log("✅ MongoDB connected");
};

//////////////////////////////////////////////////////

const userSchema = new mongoose.Schema({

  username:String,
  age:Number,
  gender:String,
  phone:String,

  emergencyname:String,
  emergencyphone:String,

  password:String

},{timestamps:true});

export const UserModel =
  mongoose.model("User",userSchema);
