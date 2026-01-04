import { Request, Response } from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";

//Controllers for User Registrations
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    //Find user by email
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    //Encrypt the Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    //Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    //Setting User Data in Session
    req.session.isLoggedIn = true;
    req.session.useId = newUser._id;
    return res.status(200).json({
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
