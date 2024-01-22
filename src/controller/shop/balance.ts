import { Response, NextFunction } from "express";
import { transactionStatus, userReqInt } from "../../module/interfaces";
import { shopModel } from "../../model/shopModel";
import { transModel } from "../../model/transactionsModel";
import { isValidObjectId } from "mongoose";

// READ
export const getBalance = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const balance = await shopModel.findOne({ userId }, { balance: 1 });
    if (!balance) throw { message: `Balance Not Found` };
    return res.status(200).json(balance);
  } catch (err) {
    return next({ status: 400, err });
  }
};

// UPDATE
export const increaseBalance = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const { amount } = req.body;
    if (!amount) throw { message: `Amount Is a Required Field` };
    if (typeof amount !== "number")
      throw { status: 403, message: `Amount Should Be a Number` };
    if (+amount < 100000)
      throw { message: `Amount Should Be At Least 10000 Tomans` };
    const findShop = await shopModel.findOne({ userId });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    const transaction = await transModel.create({
      transactionNumber: Date.now() + Math.floor(Math.random() * 10),
      shopId: findShop._id,
      description: `Increase Balance`,
      amount: +amount,
      date: Date.now(),
      transactionStat: transactionStatus.SUCCESSFUL,
    });
    await shopModel.updateOne(
      { userId: findShop.userId },
      {
        $inc: { balance: +amount },
        $push: {
          transactions: { _id: transaction._id },
        },
      }
    );
    return res.status(200).json({
      status: 200,
      message: `Your Wallet's Balance Increased`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

export const withdrawBalance = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const { amount } = req.body;
    if (!amount) throw { message: `Amount Is a Required Field` };
    if (typeof amount !== "number")
      throw { status: 403, message: `Amount Should Be a Number` };
    if (+amount < 1000000)
      throw { message: `Amount Should Be At Least 100000 Tomans` };
    const shopOwner = await shopModel.findOne({ userId });
    if (shopOwner.balance < +amount)
      throw {
        status: 403,
        message: `Your Requested Amount Is More Than Your Account's Balance`,
      };
    const findShop = await shopModel.findOne({ userId });
    const shopId = findShop._id;
    const transaction = await transModel.create({
      transactionNumber: Date.now() + Math.floor(Math.random() * 10),
      shopId,
      description: `Withdraw Balance`,
      amount: +amount,
      date: Date.now(),
      transactionStat: transactionStatus.SUCCESSFUL,
    });
    await shopModel.updateOne(
      { userId },
      {
        $inc: { balance: -+amount },
        $push: {
          transactions: { _id: transaction._id },
        },
      }
    );
    return res.status(200).json({
      status: 200,
      message: `You Have Withdrawn From Your Wallet`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};
