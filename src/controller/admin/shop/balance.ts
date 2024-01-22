import { NextFunction, Response } from "express";
import { transactionStatus, userReqInt } from "../../../module/interfaces";
import { shopModel } from "../../../model/shopModel";
import { PipelineStage } from "mongoose";
import { userModel } from "../../../model/userModel";
import { operationsModel } from "../../../model/operationsModel";
import { transModel } from "../../../model/transactionsModel";

// READ
export const getBalance = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shop_id, shop_number, min_balance, max_balance, balance } =
      req.body;
    const { page } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    const findShop = shop_id
      ? await shopModel.findById(shop_id)
      : await shopModel.findOne({ userId: shop_number });
    let query: PipelineStage[] = [];
    if (findShop) {
      query.push({ $match: { userId: findShop.userId } });
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
        shopName: 1,
        ownerFName: 1,
        ownerLName: 1,
        balance: 1,
      },
    });
    const findBalance = await shopModel.aggregate(query);
    const maxPages = Math.ceil(findBalance.length / perPage);
    if (pageNumber > maxPages) pageNumber = 1;
    query.push({ $skip: (pageNumber - 1) * perPage });
    query.push({ $limit: perPage });
    const result = await shopModel.aggregate(query);
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
    const { shop_id, shop_number, amount, increase, decrease } = req.body;
    if (!shop_id && !shop_number)
      throw { status: 404, message: `Shop Not Found` };
    if (!amount) throw { message: `Amount Is Required` };
    const findShop = shop_id
      ? await shopModel.findById(shop_id)
      : await shopModel.findOne({ userId: shop_number });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
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
      await shopModel.updateOne(
        { userId: findShop.userId },
        { $inc: { balance: +amount } }
      );
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
        { $push: { operations: transaction._id } }
      );
      const newOperation = await operationsModel.create({
        adminId: userId,
        adminName: `${findAdmin.fName} ${findAdmin.lName}`,
        operationInfo: `Increase Balance Of The Shop With Id: ${findShop._id}, Number: ${findShop.userId}And Transaction Number: ${transaction.transactionNumber}`,
        operationMethod: "INCREASESHOPBALANCE",
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
      if (+amount > findShop.balance)
        throw {
          status: 403,
          message: `Requested Amount Is More Than Shop's Balance`,
        };
      await shopModel.updateOne(
        { userId: findShop.userId },
        { $inc: { balance: -+amount } }
      );
      const transaction = await transModel.create({
        transactionNumber: Date.now() + Math.floor(Math.random() * 10),
        shopId: findShop._id,
        description: `Decrease Balance`,
        amount: +amount,
        date: Date.now(),
        transactionStat: transactionStatus.SUCCESSFUL,
      });
      await shopModel.updateOne(
        { userId: findShop.userId },
        { $push: { operations: transaction._id } }
      );
      const newOperation = await operationsModel.create({
        adminId: userId,
        adminName: `${findAdmin.fName} ${findAdmin.lName}`,
        operationInfo: `Decrease Balance Of The Shop With Id: ${findShop._id}, Number: ${findShop.userId}And Transaction Number: ${transaction.transactionNumber}`,
        operationMethod: "DECREASESHOPBALANCE",
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
