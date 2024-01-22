import { NextFunction, Response } from "express";
import { transactionStatus, userReqInt } from "../../../module/interfaces";
import { userModel } from "../../../model/userModel";
import { PipelineStage } from "mongoose";
import { operationsModel } from "../../../model/operationsModel";
import { userTransModel } from "../../../model/transactionsModel";

// READ
export const getBalance = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id, user_number, min_balance, max_balance, balance } =
      req.body;
    const { page } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    const findUser = user_id
      ? await userModel.findById(user_id)
      : await userModel.findOne({ userId: user_number });
    let query: PipelineStage[] = [];
    if (findUser) {
      query.push({ $match: { userId: findUser.userId } });
    }
    if (balance) {
      query.push({ $match: { balance: +balance } });
    }
    if (min_balance && !balance) {
      query.push({ $match: { balance: { $gte: +min_balance } } });
    }
    if (max_balance && !balance) {
      query.push({ $match: { balance: { $lte: +max_balance } } });
    }
    query.push({ $sort: { balance: -1 } });
    query.push({
      $project: {
        userId: 1,
        fName: 1,
        lName: 1,
        email: 1,
        balance: 1,
      },
    });
    const findBalance = await userModel.aggregate(query);
    const maxPages = Math.ceil(findBalance.length / perPage);
    if (pageNumber > maxPages) pageNumber = 1;
    query.push({ $skip: (pageNumber - 1) * perPage });
    query.push({ $limit: perPage });
    const result = await userModel.aggregate(query);
    if (findBalance.length !== 0) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json({
        status: 404,
        message: `No Data With Your Description Was Found`,
      });
    }
  } catch (err) {
    return next({ status: 400, err });
  }
};

// UPDATE
export const updateBalance = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const { user_id, user_number, amount, increase, decrease } = req.body;
    if (!user_id && !user_number)
      throw { status: 404, message: `User Not Found` };
    if (!amount) throw { message: `Amount Is Required` };
    const findUser = user_id
      ? await userModel.findById(user_id)
      : await userModel.findOne({ userId: user_number });
    if (!findUser) throw { status: 404, message: `User Not Found` };
    if (
      (increase && decrease) ||
      ((increase === undefined || increase === "" || increase === null) &&
        (decrease === undefined || decrease === "" || decrease === null)) ||
      (!increase && !decrease)
    )
      throw {
        message: `You Should Determine That You Want To Increase Or Decrease Balance`,
      };
    if (increase === true || increase == "true") {
      await userModel.updateOne(
        { userId: findUser.userId },
        { $inc: { balance: +amount } }
      );
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
        { $push: { operations: transaction._id } }
      );
      const newOperation = await operationsModel.create({
        adminId: userId,
        adminName: `${findAdmin.fName} ${findAdmin.lName}`,
        operationInfo: `Increase Balance Of The User With Id: ${findUser._id}, Number: ${findUser.userId} And Transaction Number ${transaction.transactionNumber}`,
        operationMethod: "INCREASEUSERBALANCE",
      });
      await userModel.updateOne(
        { userId },
        { $push: { operations: newOperation._id } }
      );
      return res.status(200).json({
        status: 200,
        message: `Balance Increased Successfully`,
        success: true,
      });
    }
    if (decrease === true || decrease === "true") {
      if (+amount > findUser.balance)
        throw {
          status: 403,
          message: `Requested Amount Is More Than User's Balance`,
        };
      await userModel.updateOne(
        { userId: findUser.userId },
        { $inc: { balance: -+amount } }
      );
      const transaction = await userTransModel.create({
        transactionNumber: Date.now() + Math.floor(Math.random() * 10),
        userObjectId: findUser._id,
        description: `Decrease Balance`,
        amount: +amount,
        date: Date.now(),
        transactionStat: transactionStatus.SUCCESSFUL,
      });
      await userModel.updateOne(
        { userId: findUser.userId },
        { $push: { operations: transaction._id } }
      );
      const newOperation = await operationsModel.create({
        adminId: userId,
        adminName: `${findAdmin.fName} ${findAdmin.lName}`,
        operationInfo: `Decrease Balance Of The User With Id: ${findUser._id} And Number: ${findUser.userId}`,
        operationMethod: "DECREASEUSERBALANCE",
      });
      await userModel.updateOne(
        { userId },
        { $push: { operations: newOperation._id } }
      );
      return res.status(200).json({
        status: 200,
        message: `Balance Decreased Successfully`,
        success: true,
      });
    }
  } catch (err) {
    return next({ status: 400, err });
  }
};
