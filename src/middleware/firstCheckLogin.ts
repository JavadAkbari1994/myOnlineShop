import { Response, NextFunction } from "express";
import { userModel } from "../model/userModel";
import { accessTokenGen, idGen, verifyAccessToken } from "../module/utils";
import { JwtPayload, userReqInt } from "../module/interfaces";

// check shavad ke user az ghabl login bude ya na
const isLogin = async (req: userReqInt, res: Response, next: NextFunction) => {
  const token = req.cookies["access_token"];
  if (!token) return false;
  const userId = req.cookies["user_id"];
  if (!userId) return false;
  const verifyAccToken = verifyAccessToken(token);
  const user = await userModel.findOne({ verifyAccToken });
  if (!user) return false;
  if (token !== user.accessToken) return false;
  return true;
};

const firstCheckLogin = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!(await isLogin(req, res, next))) {
      if (req.cookies["user_id"]) {
        const userId = req.cookies["user_id"];
        if (req.cookies["access_token"]) {
          const aToken = req.cookies["access_token"];
          const { exp } = verifyAccessToken(aToken) as JwtPayload;
          res.cookie("jwt_expires_in", exp, { sameSite: `lax`, secure: true });
        } else {
          const aToken = accessTokenGen(userId);
          const { exp } = verifyAccessToken(aToken) as JwtPayload;
          res.cookie("user_id", userId, { sameSite: `lax`, secure: true });
          res.cookie("jwt_expires_in", exp, { sameSite: `lax`, secure: true });
          res.cookie("access_token", aToken, {
            httpOnly: true,
            sameSite: `strict`,
            secure: true,
          });
        }
      } else {
        const userId = idGen();
        res.cookie("user_id", userId, { sameSite: `lax`, secure: true });
        if (req.cookies["access_token"]) {
          return next();
        } else {
          const aToken = accessTokenGen(userId);
          const { exp } = verifyAccessToken(aToken) as JwtPayload;
          res.cookie("jwt_expires_in", exp, { sameSite: `lax`, secure: true });
          res.cookie("access_token", aToken, {
            httpOnly: true,
            sameSite: `strict`,
            secure: true,
          });
        }
      }
    }
    return next();
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: `Something Went Wrong, Please Reload The Page`,
      success: false,
    });
  }
};

export { firstCheckLogin };
