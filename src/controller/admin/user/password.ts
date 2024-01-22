import { NextFunction, Response } from "express";
import { userReqInt } from "../../../module/interfaces";
import { userModel } from "../../../model/userModel";
import { operationsModel } from "../../../model/operationsModel";
import { passwordSchema } from "../../../validations/passwordSchema";
import { hashString } from "../../../module/utils";

// CREATE AND UPDATE
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
    const { user_id, user_number, password, confirm_password } = req.body;
    if (!user_id && !user_number)
      throw { message: `User Id Or Owner's Phone Number Is Required` };
    const findUser = user_id
      ? await userModel.findById(user_id)
      : await userModel.findOne({ userId: user_number });
    if (!findUser) throw { status: 404, message: `User Not Found` };
    if (findAdmin.role !== "SUPERADMIN") {
      if (findUser.role === "SUPERADMIN" || findUser.role === "ADMIN")
        throw {
          status: 403,
          message: `You Can Not Change The Password Of Super Admin Or Other Admins`,
        };
    }
    await passwordSchema.validate(
      { password, confirmPassword: confirm_password },
      { abortEarly: false }
    );
    await userModel.updateOne(
      { userId: findUser.userId },
      { $set: { password: hashString(password) } }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Change Password Of User With Id: ${findUser._id} And Number: ${findUser.userId}`,
      operationMethod: "CHANGEUSERPASSWORD",
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
