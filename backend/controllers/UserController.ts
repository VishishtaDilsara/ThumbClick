import { Request, Response } from "express";
import Thumbnail from "../models/Thumbnail.js";

//Controllers to get all user thumbnails
export const getUserThumbnails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const thumbnail = await Thumbnail.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ thumbnail });
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
    res.json(thumbnail);
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
