import { Response, NextFunction } from "express";
import {
  JwtPayload,
  availableCities,
  userReqInt,
} from "../../module/interfaces";
import { serviceSignupSchema } from "../../validations/serviceSignupSchema";
import { shopModel } from "../../model/shopModel";
import {
  accessTokenGen,
  compareHashString,
  otpGen,
  referGen,
  refreshTokenGen,
  verifyAccessToken,
} from "../../module/utils";
import { signupSchema } from "../../validations/signUpAndLoginSchema";
import { serviceModel } from "../../model/serviceModel";

// CREATE
export const signUpReq = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      service,
      cat,
      sub_cat,
      city,
      shop_name,
      owner_first_name,
      owner_last_name,
      owner_number,
      referer,
    } = req.body;
    if (!service && !cat) throw { message: `Category Is a Required Field` };
    if (!city) throw { message: `City Is a Required Field` };
    if (!Object.values(availableCities).includes(city.toLowerCase()))
      throw { status: 403, message: `City Is Not Supported` };
    if (!shop_name) throw { message: `Shop Name Is a Required Field` };
    if (!owner_first_name)
      throw { message: `Owner's First Name Is a Required Field` };
    if (!owner_last_name)
      throw { message: `Owner's Last Name Is a Required Field` };
    await serviceSignupSchema.validate({ userId: owner_number });
    const findShop = await shopModel.findOne({ userId: owner_number });
    if (findShop)
      throw {
        status: 403,
        message: `You Already Have An Account With This Phone Number`,
      };
    const findService = service
      ? await serviceModel.findById(service)
      : await serviceModel.findOne({
          category: cat.toLowerCase(),
          subCategory: sub_cat.toLowerCase(),
        });
    if (!findService) throw { message: `Service Is Not Valid` };
    await shopModel.create({
      service: {
        _id: findService._id,
        category: findService.category,
        subCategory: findService.subCategory,
      },
      city: city.toLowerCase(),
      shopName: shop_name.toLowerCase(),
      ownerFName: owner_first_name.toLowerCase(),
      ownerLName: owner_last_name.toLowerCase(),
      userId: owner_number,
      referer: `localhost:3000/refer?referrer=${referGen()}`,
    });
    if (referer) {
      const findShop = await shopModel.findOne({ referer });
      if (!findShop) throw { message: `Referer Code Is Not Valid` };
      await shopModel.updateOne(
        { referer },
        {
          $push: {
            promote: `Shop ${shop_name} Signed Up With Your Refer Code`,
          },
        }
      );
    }
    return res
      .status(201)
      .json({ status: 201, message: `Shop Created`, success: true });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// LOGIN
export const shopLoginWithOtpReq = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body;
    await serviceSignupSchema.validate({ userId });
    const shopOwner = await shopModel.findOne({ userId });
    if (!shopOwner)
      throw {
        status: 404,
        message: `Shop Not Found, Please Try To Register First`,
      };
    await shopModel.updateOne(
      { userId },
      { $set: { otp: { value: otpGen(), expiresIn: Date.now() + 60000 } } }
    );
    return res.status(200).json({
      status: 200,
      message: `One Time Password Sent To The Number ${userId}`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

export const shopLoginWithOtp = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, otp } = req.body;
    if (!userId)
      throw { status: 400, message: `Something Went Wrong, Please Try Again` };
    if (!otp) throw { status: 400, message: `Please Enter One Time Password` };
    const shopOwner = await shopModel.findOne({ userId });
    if (!shopOwner)
      throw {
        status: 404,
        message: `Shop Not Found, Please Try To Signup First`,
      };
    if (+otp !== shopOwner.otp?.value)
      throw { message: `One Time Password Is Wrong` };
    if (Date.now() > shopOwner.otp?.expiresIn)
      throw { message: `One Time Password Expired` };
    const aToken = accessTokenGen(userId);
    const rToken = refreshTokenGen(userId);
    await shopModel.updateOne(
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

export const shopLoginWithPassword = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, password } = req.body;
    await signupSchema.validate({ userId, password }, { abortEarly: false });
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    if (!password) throw { message: `Please Enter Your Password` };
    const shopOwner = await shopModel.findOne({ userId });
    if (!shopOwner)
      throw {
        status: 404,
        message: `You Don't Have An Account, Please Try To Sign Up With One Time Password`,
      };
    if (!shopOwner.password)
      throw {
        message: `Your Account Does Not Have A Password, Please Try One Time Password`,
      };
    if (!compareHashString(password, shopOwner.password as string))
      throw { message: `Password Is Wrong` };
    const aToken = accessTokenGen(userId);
    const rToken = refreshTokenGen(userId);
    await shopModel.updateOne(
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
    await shopModel.updateOne(
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
