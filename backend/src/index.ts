import express from "express";
import cors from "cors";
import {z} from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "./db";
import { UserType } from "./db";
import dotenv from "dotenv";
import { connectDB } from "./db";
import mongoose, { Types } from "mongoose";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
const app = express();
app.use(express.json());
app.use(cors());
connectDB();
app.post("/api/v1/signup", async (req, res) => {
  const requiredbody = z.object({
    username: z.string().min(2).max(100),
    age: z.number().int().min(1).max(120),
    gender: z.enum(["male", "female", "other"]),
    phone: z.string().regex(/^[6-9]\d{9}$/),
    emergencyname: z.string().min(2),
    emergencyphone: z.string().regex(/^[6-9]\d{9}$/),
    password: z.string().min(3).max(30),
  });

  const parsedbody = requiredbody.safeParse({
    ...req.body,
    age: Number(req.body.age),
    
  });

  if (!parsedbody.success) {
    return res.status(400).json({
      message: "Incorrect format",
      error: parsedbody.error.format(),
    });
  }

  const {
    username,
    age,
    gender,
    phone,
    emergencyname,
    emergencyphone,
    password,
  } = parsedbody.data;

  const hashedpassword = await bcrypt.hash(password, 5);

  try {
    await UserModel.create({
      username,
      age,
      gender,
      phone,
      emergencyname,
      emergencyphone,
      password: hashedpassword,
    });

    res.json({ message: "Sign up successful" });
  } catch (e) {
    res.status(409).json({ message: "User already exists" });
  }
});



app.post("/api/v1/signin" , async (req,res)=>{
   const username= req.body.username;
   const password= req.body.password;


   const existingUser= await UserModel.findOne({
    username
   }) as UserType


   if(!existingUser){
    res.status(403).json({
        message:"User does not exist"
    })
    return
   }


   const passwordMatch= await bcrypt.compare(password, existingUser.password)
   
   if (!JWT_SECRET) {
  throw new Error("JWT_SECRET missing");
   }
   if(passwordMatch){
    const token= jwt.sign({
      id: existingUser._id
    }, JWT_SECRET)


    res.json({
        token
    })
   }else{
    res.status(403).json({
        message: "Incorrect credentials"
    })
   }


})

app.listen(3000)