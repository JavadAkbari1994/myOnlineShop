import { NextFunction, Response } from "express";
import { verifyAccessToken } from "../module/utils";
import { JwtPayload, userReqInt } from "../module/interfaces";
import { userModel } from "../model/userModel";
import { shopModel } from "../model/shopModel";

const checkLogin = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const accToken = req.cookies["access_token"];
    if (!accToken) throw {};
    const { userId } = verifyAccessToken(accToken) as JwtPayload;
    if (!userId) throw {};
    const shopOwner = await shopModel.findOne({ userId });
    if (shopOwner) {
      if (accToken !== shopOwner.accessToken) throw {};
      req.userId = shopOwner.userId;
      return next();
    }
    const user = await userModel.findOne({ userId });
    if (user) {
      if (accToken !== user.accessToken) throw {};
      req.userId = user.userId;
      return next();
    }
    if (!user && !shopOwner) throw { message: `User Not Found!` };
  } catch (err) {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.clearCookie("jwt_expires_in");
    err = { status: 401, message: `Please Login To Your Account` };
    next({ err });
  }
};

export { checkLogin };
