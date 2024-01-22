import { Response, NextFunction } from "express";
import { JwtPayload, userReqInt } from "../module/interfaces";
import { accessTokenGen, verifyRefreshToken } from "../module/utils";
import { userModel } from "../model/userModel";
import { shopModel } from "../model/shopModel";

export const refreshTokenController = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken) throw { message: `You Are Not Authorized` };
    const { userId } = verifyRefreshToken(refreshToken) as JwtPayload;
    if (!userId) throw { message: `You Are Not Authorized` };
    const user = await userModel.findOne({ userId });
    if (user) {
      const aToken = accessTokenGen(user.userId);
      user.accessToken = aToken;
      user.save();
      res.cookie("access_token", aToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        maxAge: 34560000000,
      });
    }
    const shopOwner = await shopModel.findOne({ userId });
    if (shopOwner) {
      const aToken = accessTokenGen(shopOwner.userId);
      shopOwner.accessToken = aToken;
      shopOwner.save();
      res.cookie("access_token", aToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        maxAge: 34560000000,
      });
    }
    if (!user && !shopOwner) throw { message: `User Not Found!` };
    return res.status(200).json({
      status: 200,
      message: `New Access Token Created`,
      success: true,
    });
  } catch (err) {
    return next({ status: 401, err });
  }
};
