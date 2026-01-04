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
    req.session.userId = newUser._id;
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
    return res
      .status(500)
      .json({ message: "Something went wrong when registering" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    //Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid Email or Password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid Email or Password" });
    }

    //Setting User Data in Session
    req.session.isLoggedIn = true;
    req.session.userId = user._id;
    return res.status(200).json({
      message: "Login Successfull",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Something went wrong when logging in" });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  req.session.destroy((err: any) => {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .json({ message: "Something went wrong when logging out" });
    }
  });
  return res.status(500).json({ message: "Logout Successfull" });
};

//Controller for user verify
export const verifyUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      return res.status(200).json({ user });
    }
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
