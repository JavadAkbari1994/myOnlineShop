import { Response, NextFunction } from "express";
import { userReqInt } from "../../../module/interfaces";
import { shopModel } from "../../../model/shopModel";
import fs from "fs";
import path from "path";
import { operationsModel } from "../../../model/operationsModel";
import { userModel } from "../../../model/userModel";

// CREATE AND UPDATE
export const uploadProfileIcon = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const { shop_id, shop_number } = req.body;
    if (!shop_id && shop_number)
      throw { status: 404, message: `Shop Not Found` };
    const findShop = shop_id
      ? await shopModel.findById(shop_id)
      : await shopModel.findOne({ userId: shop_number });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    const imagePath = req.file?.path || "";
    if (!imagePath) throw { message: `Something Went Wrong, Please Try Again` };
    await shopModel.updateOne(
      { userId },
      {
        $set: {
          image: { icon: { url: imagePath, date: Date.now() } },
          isActive: false,
        },
      }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Upload Icon Image For Shop With Id: ${findShop._id} And Owner's Number: ${findShop.userId}`,
      operationMethod: "UPLOADICONIMAGE",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(200).json({
      status: 200,
      message: `Icon Image Uploaded Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// READ
export const getProfileIcon = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shop_id, shop_number } = req.body;
    if (!shop_id && shop_number)
      throw { status: 404, message: `Shop Not Found` };
    const findShop = shop_id
      ? await shopModel.findById(shop_id)
      : await shopModel.findOne({ userId: shop_number });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    const imageUrl = findShop.image.icon.url;
    if (!imageUrl) throw { status: 404, message: `Icon Not Found` };
    return res.status(200).json(imageUrl);
  } catch (err) {
    return next({ status: 404, err });
  }
};

// DELETE
export const deleteProfileIcon = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const { shop_id, shop_number } = req.body;
    if (!shop_id && shop_number)
      throw { status: 404, message: `Shop Not Found` };
    const findShop = shop_id
      ? await shopModel.findById(shop_id)
      : await shopModel.findOne({ userId: shop_number });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    const imageUrl = findShop.image.icon.url;
    if (!imageUrl) throw { message: `You Don't Have An Icon To Delete` };
    fs.unlinkSync(path.join(imageUrl));
    await shopModel.updateOne(
      { userId },
      { $set: { image: { icon: { url: "", date: "" } } } }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Delete Icon Image For Shop With Id: ${findShop._id} And Owner's Number: ${findShop.userId}`,
      operationMethod: "DELETEICONIMAGE",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(200).json({
      status: 200,
      message: `Profile Icon Deleted Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 404, err });
  }
};
