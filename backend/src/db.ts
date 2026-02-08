import mongoose from "mongoose";

export const connectDB = async () => {

  await mongoose.connect(process.env.MONGO_URI!);

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
