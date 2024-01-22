import { Response, NextFunction } from "express";
import { userReqInt } from "../../module/interfaces";
import { userModel } from "../../model/userModel";
import { updateProfileSchema } from "../../validations/updateProfileSchema";

// CREATE
export const getName = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `User Not Found` };
    const { first_name, last_name } = req.body;
    if (!first_name) throw { message: `First Name Is a Required Field` };
    if (!last_name) throw { message: `Last Name Is a Required Field` };
    const findUser = await userModel.findOneAndUpdate(
      { userId },
      { $set: { fName: first_name, lName: last_name } }
    );
    if (!findUser) throw { status: 404, message: `User Not Found` };
    return res.status(200).json({
      status: 200,
      message: `First Name And Last Name Successfully Submitted`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// READ
export const getProfile = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const user = await userModel.findOne(
      { userId },
      { fName: 1, lName: 1, userId: 1, email: 1 }
    );
    if (!user) throw { status: 404, message: `User Not Found!` };
    return res.status(200).json(user);
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
    const { fName, lName, email } = req.body;
    await updateProfileSchema.validate(
      { fName, lName, email: email.toLowerCase() },
      { abortEarly: false }
    );
    await userModel.updateOne(
      { userId },
      {
        $set: {
          fName,
          lName,
          email: email.toLowerCase(),
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
