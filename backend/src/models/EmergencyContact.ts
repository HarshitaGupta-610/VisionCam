import mongoose from "mongoose";

const schema = new mongoose.Schema({

  userId:{
    type:String,
    required:true
  },

  name:String,
  phone:String,

  chatId:{
    type:String,
    required:true
  }

},{timestamps:true});

export default mongoose.model(
  "EmergencyContact",
  schema
);
