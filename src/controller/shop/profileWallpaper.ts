import { NextFunction, Response } from "express";
import { userReqInt } from "../../module/interfaces";
import { shopModel } from "../../model/shopModel";
import fs from "fs";
import path from "path";

// CREATE AND UPDATE
export const uploadProfileWallpaper = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Shop Not Found` };
    const findShop = await shopModel.findOne({ userId });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    const imagePath = req.file?.path || "";
    if (!imagePath) throw { message: `Something Went Wrong, Please Try Again` };
    await shopModel.updateOne(
      { userId },
      {
        $set: {
          image: { wallpaper: { url: imagePath, date: Date.now() } },
          isActive: false,
        },
      }
    );
    return res.status(200).json({
      status: 200,
      message: `Wallpaper Image Uploaded Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// READ
export const getProfileWallpaper = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Shop Not Found` };
    const findShop = await shopModel.findOne({ userId });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    const imageUrl = findShop.image.icon.url;
    if (!imageUrl) throw { status: 404, message: `Wallpaper Not Found` };
    return res.status(200).json(imageUrl);
  } catch (err) {
    return next({ status: 404, err });
  }
};

// DELETE
export const deleteProfileWallpaper = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Shop Not Found` };
    const findShop = await shopModel.findOne({ userId });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    const imageUrl = findShop.image.icon.url;
    if (!imageUrl) throw { message: `You Don't Have a Wallpaper To Delete` };
    fs.unlinkSync(path.join(imageUrl));
    await shopModel.updateOne(
      { userId },
      { $set: { image: { wallpaper: { url: "", date: "" } } } }
    );
    return res.status(200).json({
      status: 200,
      message: `Profile Wallpaper Deleted Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 404, err });
  }
};
