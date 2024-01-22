import { NextFunction, Response } from "express";
import {
  transactionStatus,
  updateTransInt,
  userReqInt,
} from "../../../module/interfaces";
import { PipelineStage, isValidObjectId } from "mongoose";
import { userModel } from "../../../model/userModel";
import { userTransModel } from "../../../model/transactionsModel";
import { operationsModel } from "../../../model/operationsModel";

// CREATE
export const createTransaction = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      req_user_id,
      req_user_number,
      amount,
      description,
      transaction_status,
    } = req.body;
    if (!req_user_id) throw { message: `Shop Id Is a Required Field` };
    if (
      !amount ||
      !description ||
      !transactionStatus ||
      !Object.values(transactionStatus).includes(
        transaction_status.toUpperCase()
      )
    )
      throw { message: `Inputs Are Not Valid` };
    const findUser = req_user_id
      ? await userModel.findById(req_user_id)
      : await userModel.findOne({ userId: req_user_number });
    if (!findUser) throw { status: 404, message: `Shop Not Found` };
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const newTrans = await userTransModel.create({
      transactionNumber: Date.now() + Math.floor(Math.random() * 10),
      userObjectId: findUser._id,
      amount: +amount,
      description,
      date: Date.now(),
      transactionStat: transaction_status.toUpperCase(),
    });
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Creating Transaction With Id: ${newTrans._id} And Transaction Number: ${newTrans.transactionNumber} For User With Id: ${newTrans.userObjectId}`,
      operationMethod: "CREATETRANSACTION",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(200).json({
      status: 200,
      message: `Transaction Created Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// READ
export const getTransactions = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    let {
      user_id,
      user_number,
      trans_number,
      page,
      amount,
      max_amount,
      min_amount,
      description,
      transaction_status,
    } = req.body;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    let query: PipelineStage[] = [];
    if (user_id && isValidObjectId(user_id)) {
      const findUser = await userModel.findById(user_id);
      if (findUser) query.push({ $match: { userObjectId: findUser._id } });
    }
    if (user_number) {
      const findUser = await userModel.findOne({ userId: user_number });
      if (findUser) query.push({ $match: { userId: findUser.userId } });
    }
    if (trans_number) {
      const findTrans = await userTransModel.findOne({
        transactionNumber: +trans_number,
      });
      if (findTrans) {
        query.push({ $match: { transactionNumber: +trans_number } });
      }
    }
    if (amount) {
      query.push({ $match: { amount: +amount } });
    }
    if (min_amount && !amount) {
      query.push({ $match: { amount: { $gte: +min_amount } } });
    }
    if (max_amount && !amount) {
      query.push({ $match: { amount: { $lte: +max_amount } } });
    }
    if (description) {
      query.push({
        $match: { description: { $regex: description, $options: "i" } },
      });
    }
    if (transaction_status && transaction_status.length !== 0) {
      const statuses = Array.isArray(transaction_status)
        ? transaction_status
        : [transaction_status];
      const fixCaseSens = statuses.map((item) => String(item).toUpperCase());
      query.push({ $match: { transactionStat: { $in: fixCaseSens } } });
    }
    query.push({ $sort: { date: -1 } });
    const findTrans = await userTransModel.aggregate(query);
    const maxPages = Math.ceil(findTrans.length / perPage);
    if (pageNumber > maxPages) pageNumber = 1;
    query.push({ $skip: (pageNumber - 1) * perPage });
    query.push({ $limit: perPage });
    const result = await userTransModel.aggregate(query);
    findTrans.length !== 0
      ? res.status(200).json(result)
      : res.status(404).json({
          status: 404,
          message: `No Transaction With Your Description Was Found`,
        });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// UPDATE
export const updateTransaction = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { trans_id, trans_number, amount, description, transaction_status } =
      req.body;
    if (!trans_id && !trans_number)
      throw { status: 404, message: `Transaction Not Found` };
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const findTrans = trans_id
      ? await userTransModel.findById(trans_id)
      : await userTransModel.findOne({ transactionNumber: +trans_number });
    if (!findTrans) throw { status: 404, message: `Transaction Not Found` };
    let updateFields: updateTransInt = {};
    if (amount) updateFields.amount = +amount;
    if (description) updateFields.description = description;
    if (
      transaction_status &&
      Object.values(transactionStatus).includes(
        transaction_status.toUpperCase()
      )
    ) {
      updateFields.transactionStat = transaction_status.toUpperCase();
    }
    await userTransModel.updateOne(
      { _id: findTrans._id },
      { $set: updateFields }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Updating Transaction With Id: ${findTrans._id} And Transaction Number: ${findTrans.transactionNumber} For User With Id: ${findTrans.userObjectId}`,
      operationMethod: "UPDATETRANSACTION",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(200).json({
      status: 200,
      message: `Transaction Updated Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// DELETE
export const deleteTransaction = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { trans_id, trans_number } = req.body;
    if (!trans_id && !trans_number)
      throw { status: 404, message: `Transaction Not Found` };
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const findTrans = trans_id
      ? await userTransModel.findById(trans_id)
      : await userTransModel.findOne({ transactionNumber: +trans_number });
    if (!findTrans) throw { status: 404, message: `Transaction Not Found` };
    await userModel.findByIdAndUpdate(findTrans.userObjectId, {
      $pull: { transactions: { _id: findTrans._id } },
    });
    await userTransModel.deleteOne({
      transactionNumber: findTrans.transactionNumber,
    });
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Delete Transaction With Id: ${findTrans._id} And Transaction Number: ${findTrans.transactionNumber} For User With Id: ${findTrans.userObjectId}`,
      operationMethod: "DELETETRANSACTION",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(200).json({
      status: 200,
      message: `Transaction Deleted Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};
