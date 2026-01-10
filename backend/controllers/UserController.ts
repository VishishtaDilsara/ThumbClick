import { Request, Response } from "express";
import Thumbnail from "../models/Thumbnail.js";
import nodemailer from "nodemailer";

//Controllers to get all user thumbnails
export const getUserThumbnails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const thumbnails = await Thumbnail.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ thumbnails });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

//Controller to get single thumbnail of a user
export const getThumbnailbyId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const { id } = req.params;

    const thumbnail = await Thumbnail.findOne({ userId, _id: id });
    res.json({ thumbnail });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const transport = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GOOGLE_EMAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

export function sendMessageByCustomer(req: Request, res: Response) {
  const email = req.body.email;
  const userMessage = req.body.message;
  const name = req.body.name;

  if (!email) {
    return res.status(403).json({ message: "Email is required" });
  }

  if (!userMessage) {
    return res.status(403).json({ message: "Message is required" });
  }

  const mailOptions = {
    from: email,
    to: "vishishtadilsara2002@gmail.com",
    subject: "New Customer Message",
    html: `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7fc; color: #333;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; padding: 25px; 
                box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #eee;">
      
      <h2 style="color: #5a4fcf; margin-top: 0; text-align: center;">
        💌 New Customer Message
      </h2>

      <p style="font-size: 15px; margin-bottom: 10px;">
        You received a new message from your website contact form.
      </p>

      <!-- Customer Name -->
      <div style="background: #e8f7ff; padding: 15px; border-radius: 10px; margin-top: 20px;">
        <p style="margin: 0; font-size: 14px;"><strong>👤 Customer Name:</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;">${name}</p>
      </div>

      <!-- Customer Email -->
      <div style="background: #f2f2ff; padding: 15px; border-radius: 10px; margin-top: 20px;">
        <p style="margin: 0; font-size: 14px;"><strong>📧 Customer Email:</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;">${email}</p>
      </div>

      <!-- Message -->
      <div style="margin-top: 20px; background: #f6f6f6; padding: 15px; border-radius: 10px;">
        <p style="margin: 0; font-size: 14px;"><strong>📝 Message:</strong></p>
        <p style="white-space: pre-line; margin-top: 5px; font-size: 15px;">
          ${userMessage}
        </p>
      </div>

      <p style="text-align: center; font-size: 13px; color: #777; margin-top: 30px;">
        This message was sent automatically from your website contact form.
      </p>

    </div>
  </div>
  `,
  };

  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ message: "Error sending message", error });
    }
    res.json({ message: "Message sent successfully" });
  });
}
