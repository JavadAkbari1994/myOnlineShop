import { Response, NextFunction } from "express";
import { rolesInt, userReqInt } from "../../../module/interfaces";
import { userModel } from "../../../model/userModel";

// READ
export const getAdmins = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    // const { userId } = req;
    // if (!userId) throw { status: 404, message: `User Not Found` };
    // const findUser = await userModel.findOne({ userId });
    // if (!findUser) throw { status: 404, message: `User Not Found` };
    // if (findUser.role !== rolesInt.SUPERADMIN)
    //   throw { status: 403, message: `You Are Not Authorized` };
    const findAdmins = await userModel.find(
      { role: rolesInt.ADMIN },
      { _id: 1, fName: 1, lName: 1, userId: 1 }
    );
    if (!findAdmins) throw { message: `You Don't Have Any Admins` };
    return res.status(200).json(findAdmins);
  } catch (err) {
    return next({ status: 400, err });
  }
};
