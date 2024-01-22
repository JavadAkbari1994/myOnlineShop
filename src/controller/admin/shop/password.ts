import { NextFunction, Response } from "express";
import { userReqInt } from "../../../module/interfaces";
import { userModel } from "../../../model/userModel";
import { operationsModel } from "../../../model/operationsModel";
import { shopModel } from "../../../model/shopModel";
import { passwordSchema } from "../../../validations/passwordSchema";
import { hashString } from "../../../module/utils";

export const updatePassword = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const { shop_id, shop_number, password, confirm_password } = req.body;
    if (!shop_id && !shop_number)
      throw { message: `Shop Id Or Owner's Phone Number Is Required` };
    const findShop = shop_id
      ? await shopModel.findById(shop_id)
      : await shopModel.findOne({ userId: shop_number });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    await passwordSchema.validate(
      { password, confirmPassword: confirm_password },
      { abortEarly: false }
    );
    await shopModel.updateOne(
      { userId: findShop.userId },
      { $set: { password: hashString(password) } }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Change Password Of Shop With Id: ${findShop._id} And Owner's Number: ${findShop.userId}`,
      operationMethod: "CHANGESHOPPASSWORD",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(200).json({ status: 200, message: `Password Updated Successfully`, success: true });
  } catch (err) {
    return next({ status: 400, err });
  }
};
