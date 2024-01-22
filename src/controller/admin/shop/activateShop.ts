import { NextFunction, Response } from "express";
import { userReqInt } from "../../../module/interfaces";
import { userModel } from "../../../model/userModel";
import { isValidObjectId } from "mongoose";
import { shopModel } from "../../../model/shopModel";
import { operationsModel } from "../../../model/operationsModel";

export const activateShop = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `User Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const { shop_id, shop_number, activation_status } = req.body;
    const isBoolean =
      /^(true)$/i.test(activation_status.toLowerCase()) ||
      /^(false)$/i.test(activation_status.toLowerCase());
    if (isBoolean == false) throw { message: `Activation Status Is Not Valid` };
    if (!shop_id && !shop_number)
      throw { status: 404, message: `Shop Not Found` };
    if (shop_id && !isValidObjectId(shop_id))
      throw { message: `Shop Not Found` };
    const findShop = shop_id
      ? await shopModel.findById(shop_id)
      : await shopModel.findOne({ userId: shop_number });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    await shopModel.updateOne(
      { userId: findShop.userId },
      {
        $set: { isActive: activation_status.toLowerCase() },
      }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Activity Status Of Shop With Owner Id: ${findShop.userId}, Id: ${findShop._id} And Name: ${findShop.shopName} Successfully Change To ${activation_status.toLowerCase()}`,
      operationMethod: "ACTIVATION",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(200).json({
      status: 200,
      message: `Shop Activity Status Updated To ${activation_status.toLowerCase()}`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};
