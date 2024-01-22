import { Response, NextFunction } from "express";
import { myErrors, userReqInt } from "../module/interfaces";
import { userModel } from "../model/userModel";
import { shopModel } from "../model/shopModel";

export const checkRole = (allowedRoles: string[]) => {
  return async (req: userReqInt, res: Response, next: NextFunction) => {
    try {
      const { userId } = req;
      if (!userId) throw { status: 404, message: `User Not Found` };
      const findShop = await shopModel.findOne({ userId });
      if (findShop) {
        const userRole = findShop.role;
        if (!allowedRoles.includes(userRole))
          throw { status: 403, message: `You Are Not Authorized` };
      }
      const findUser = await userModel.findOne({ userId });
      if (findUser) {
        const userRole = findUser.role;
        if (!allowedRoles.includes(userRole))
          throw { status: 403, message: `You Are Not Authorized` };
      }
      if (!findShop && !findUser)
        throw { status: 404, message: `User Not Found` };
      return next();
    } catch (err) {
      return next({status: 400, err})
    }
  };
};
