import { Response, NextFunction } from "express";
import { userReqInt } from "../../module/interfaces";
import { shopModel } from "../../model/shopModel";
import { updateProfileSchema } from "../../validations/updateProfileSchema";
import { verifyIranianNationalId } from "@persian-tools/persian-tools";
import path from "path";

// READ
export const getProfile = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const findShop = await shopModel.findOne({ userId });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    const imageIconUrl = findShop.image.icon.url;
    const imageWallpaperUrl = findShop.image.wallpaper.url;
    const shopOwner = await shopModel.findOne(
      { userId },
      {
        ownerFName: 1,
        ownerLName: 1,
        userId: 1,
        email: 1,
        nationalId: 1,
        image: {
          icon: { url: imageIconUrl },
          wallpaper: { url: imageWallpaperUrl },
        },
      }
    );
    if (!shopOwner) throw { status: 404, message: `Shop Not Found` };
    return res.status(200).json(shopOwner);
  } catch (err) {
    return next({ status: 400, err });
  }
};

// UPDATE
export const updateProfile = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const { ownerFName, ownerLName, email, nationalId } = req.body;
    await updateProfileSchema.validate(
      { fName: ownerFName, lName: ownerLName, email },
      { abortEarly: false }
    );
    if (!ownerFName) throw { message: `Owner's First Name Is Required` };
    if (!ownerLName) throw { message: `Owner's Last Name Is Required` };
    if (!nationalId) throw { message: `National Id Is a Required Field` };
    if (!verifyIranianNationalId(nationalId))
      throw { message: `Your National Id Is Not Valid` };
    await shopModel.updateOne(
      { userId },
      {
        $set: {
          ownerFName,
          ownerLName,
          email: email.toLowerCase(),
          nationalId,
        },
      }
    );
    return res.status(200).json({
      status: 200,
      message: `Your Profile Updated`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};
