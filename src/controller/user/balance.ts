import { Response, NextFunction } from "express";
import { transactionStatus, userReqInt } from "../../module/interfaces";
import { userModel } from "../../model/userModel";
import { userTransModel } from "../../model/transactionsModel";

// READ
export const getBalance = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const balance = await userModel.findOne({ userId }, { balance: 1 });
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
    const findUser = await userModel.findOne({ userId });
    if (!findUser) throw { status: 404, message: `User Not Found` };
    const { amount } = req.body;
    if (!amount) throw { message: `Amount Is a Required Field` };
    if (typeof amount !== "number")
      throw { status: 403, message: `Amount Should Be a Number` };
    if (amount < 100000)
      throw { message: `Amount Should Be At Least 10000 Tomans` };
    const transaction = await userTransModel.create({
      transactionNumber: Date.now() + Math.floor(Math.random() * 10),
      userObjectId: findUser._id,
      description: `Increase Balance`,
      amount: +amount,
      date: Date.now(),
      transactionStat: transactionStatus.SUCCESSFUL,
    });
    await userModel.updateOne(
      { userId: findUser.userId },
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
