import { Response, NextFunction } from "express";
import { rolesInt, userReqInt } from "../../../module/interfaces";
import { userModel } from "../../../model/userModel";
import { shopModel } from "../../../model/shopModel";
import { operationsModel } from "../../../model/operationsModel";

export const changeRole = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const { user_id, role } = req.body;
    if (!user_id) throw { status: 404, message: `User Not Found` };
    if (!role) throw { message: `You Should Define Role For This User` };
    if (!Object.values(rolesInt).includes(role.toUpperCase()))
      throw {
        status: 403,
        message: `You Should Define Role In The Existing Ones`,
      };
    const findUser = await userModel.findOne({ userId: user_id });
    if (!findUser) {
      const findShop = await shopModel.findOne({ userId: user_id });
      if (!findShop) throw { status: 404, message: `User Not Found` };
      if (findShop)
        throw { status: 403, message: `You Can Not Change The Role Of a Shop` };
    }
    if (findUser) {
      if (role == rolesInt.SHOP || role === rolesInt.SUPERADMIN)
        throw {
          status: 403,
          message: `You Can Not Implement This Role Change`,
        };
    }
    if (findUser.role == role.toUpperCase())
      throw { message: `User Already Is In Role ${role}` };
    await userModel.updateOne(
      { userId: user_id },
      { $set: { role: role.toUpperCase() } }
    );
    const findAdmin = await userModel.findOne({ userId });
    const addOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Changing The Role Of ${user_id} From ${findUser.role} To ${role.toUpperCase()} `,
      operationMethod: "CHANGEROLE",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: { _id: addOperation._id } } }
    );
    return res.status(200).json({
      status: 200,
      message: `User Role Changed To ${role.toUpperCase()}`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};
