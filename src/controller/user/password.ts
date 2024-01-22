import { Response, NextFunction } from "express";
import { userReqInt } from "../../module/interfaces";
import { passwordSchema } from "../../validations/passwordSchema";
import { userModel } from "../../model/userModel";
import { compareHashString, hashString } from "../../module/utils";

// CREATE
export const createPassword = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const { password, confirmPassword } = req.body;
    if (!password) throw { message: `Password Field Should Not Be Empty` };
    if (!confirmPassword)
      throw { message: `Confirm Password Field Should Not Be Empty` };
    await passwordSchema.validate(
      { password, confirmPassword },
      { abortEarly: false }
    );
    const user = await userModel.findOne({ userId });
    if (!user) throw { status: 404, message: `User Not Found!` };
    if (user.password)
      throw {
        status: 403,
        message: `You Have Already Set a Password For Your Account`,
      };
    await userModel.updateOne(
      { userId },
      { $set: { password: hashString(password) } }
    );
    return res.status(200).json({
      status: 200,
      message: `Your Password Have Set On Your Account`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// UPDATE
export const changePassword = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const {
      currentPassword,
      newPassword: password,
      confirmNewPassword: confirmPassword,
    } = req.body;
    if (!currentPassword)
      throw { message: `Current Password Field Should Not Be Empty` };
    if (!password) throw { message: `New Password Field Should Not Be Empty` };
    if (!confirmPassword)
      throw { message: `Confirm New Password Field Should Not Be Empty` };
    await passwordSchema.validate(
      { password, confirmPassword },
      { abortEarly: false }
    );
    const user = await userModel.findOne({ userId });
    if (!user) throw { status: 404, message: `User Not Found!` };
    if (!compareHashString(currentPassword, user.password))
      throw { status: 401, message: `Your Current Password Is Not Correct` };
    if (compareHashString(password, user.password))
      throw { message: `Your Current Password And New Password Are The Same` };
    await userModel.updateOne(
      { userId },
      { $set: { password: hashString(password) } }
    );
    return res.status(200).json({
      status: 200,
      message: `Your Password Is Changed`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// DELETE
// Actually Deleting The Old Forgotten Password And Replacing With a New One
export const resetPassword = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const { password, confirmPassword } = req.body;
    if (!password) throw { message: `Password Field Should Not Be Empty` };
    if (!confirmPassword)
      throw { message: `Confirm Password Field Should Not Be Empty` };
    await passwordSchema.validate(
      { password, confirmPassword },
      { abortEarly: false }
    );
    const user = await userModel.findOne({ userId });
    if (!user) throw { status: 404, message: `User Not Found!` };
    await userModel.updateOne(
      { userId },
      { $set: { password: hashString(password) } }
    );
    return res.status(200).json({
      status: 200,
      message: `Your Password Has Been Recovered`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};