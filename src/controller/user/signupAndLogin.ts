import { Response, NextFunction } from "express";
import { JwtPayload, userReqInt } from "../../module/interfaces";
import { signupSchema } from "../../validations/signUpAndLoginSchema";
import { userModel } from "../../model/userModel";
import { accessTokenGen, compareHashString, otpGen, referGen, refreshTokenGen, verifyAccessToken } from "../../module/utils";

// CREATE
export const signupOrLoginReq = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body;
    await signupSchema.validate({ userId }, { abortEarly: false });
    const user = await userModel.findOne({ userId });
    if (!user) {
      await userModel.create({
        userId,
        otp: { value: otpGen(), expiresIn: Date.now() + 60000 },
        refer: `localhost:3000/refer?referrer=${referGen()}`,
      });
      return res.status(201).json({
        status: 201,
        message: `One Time Password Sent To The Number ${userId}`,
        success: true,
      });
    } else {
      if (user.password) {
        return res.status(200).json({
          status: 200,
          message: `Go To Route: /user/login-with-password`,
          success: true,
        });
      } else {
        await userModel.updateOne(
          { userId },
          { $set: { otp: { value: otpGen(), expiresIn: Date.now() + 60000 } } }
        );
        return res.status(200).json({
          status: 200,
          message: `One Time Password Sent To The Number ${userId}`,
          success: true,
        });
      }
    }
  } catch (err) {
    return next({ status: 400, err });
  }
};

// LOGIN
export const loginWithPassword = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, password } = req.body;
    await signupSchema.validate({ userId, password }, { abortEarly: false });
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    if (!password) throw { message: `Please Enter Your Password` };
    const user = await userModel.findOne({ userId });
    if (!user)
      throw {
        status: 404,
        message: `You Don't Have An Account, Please Try Signing Up With One Time Password`,
      };
    if (!user.password)
      throw {
        message: `Your Account Does Not Have A Password, Please Try One Time Password`,
      };
    if (!compareHashString(password, user.password as string))
      throw { message: `Password Is Wrong` };
    const aToken = accessTokenGen(userId);
    const rToken = refreshTokenGen(userId);
    await userModel.updateOne(
      { userId },
      { $set: { accessToken: aToken, refreshToken: rToken } }
    );
    const { exp } = verifyAccessToken(aToken) as JwtPayload;
    res.cookie("jwt_expires_in", exp, { sameSite: `lax`, secure: true });
    res.cookie("access_token", aToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 34560000000,
    });
    res.cookie("refresh_token", rToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 34560000000,
    });
    return res
      .status(200)
      .json({ status: 200, message: `Welcome`, success: true });
  } catch (err) {
    return next({ status: 401, err });
  }
};

export const loginWithOtpReq = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body;
    await signupSchema.validate({ userId });
    const user = await userModel.findOne({ userId });
    if (!user) throw { message: `User Not Found, Please Try To Signup First` };
    await userModel.updateOne(
      { userId },
      { $set: { otp: { value: otpGen(), expiresIn: Date.now() + 60000 } } }
    );
    return res.status(200).json({
      status: 200,
      message: `One Time Password Sent To The Number ${userId}`,
      success: true,
    });
  } catch (err) {
    return next({ status: 401, err });
  }
};

export const loginWithOtp = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, otp } = req.body;
    if (!userId)
      throw { status: 400, message: `Something Went Wrong, Please Try Again` };
    if (!otp) throw { status: 400, message: `Please Enter One Time Password` };
    const user = await userModel.findOne({ userId });
    if (!user)
      throw {
        status: 404,
        message: `User Not Found, Please Try To Signup First`,
      };
    if (+otp !== user.otp?.value)
      throw { message: `One Time Password Is Wrong` };
    if (Date.now() > user.otp?.expiresIn)
      throw { message: `One Time Password Expired` };
    const aToken = accessTokenGen(userId);
    const rToken = refreshTokenGen(userId);
    await userModel.updateOne(
      { userId },
      { $set: { accessToken: aToken, refreshToken: rToken } }
    );
    const { exp } = verifyAccessToken(aToken) as JwtPayload;
    res.cookie("jwt_expires_in", exp, { sameSite: `lax`, secure: true });
    res.cookie("access_token", aToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 34560000000,
    });
    res.cookie("refresh_token", rToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 34560000000,
    });
    return res
      .status(200)
      .json({ status: 200, message: `Welcome`, success: true });
  } catch (err) {
    return next({ status: 401, err });
  }
};

// LOGOUT
export const logout = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    await userModel.updateOne(
      { userId },
      { $set: { accessToken: "", refreshToken: "" } }
    );
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.clearCookie("jwt_expires_in");
    return res.status(200).json({
      status: 200,
      message: `You Logged Out Of Your Account`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};