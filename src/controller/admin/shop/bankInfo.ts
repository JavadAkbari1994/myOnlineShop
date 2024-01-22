import { NextFunction, Response } from "express";
import { userReqInt } from "../../../module/interfaces";
import { shopModel } from "../../../model/shopModel";
import {
  getBankNameFromCardNumber,
  isShebaValid,
  verifyCardNumber,
} from "@persian-tools/persian-tools";
import { operationsModel } from "../../../model/operationsModel";
import { userModel } from "../../../model/userModel";
import { PipelineStage } from "mongoose";

// READ
export const getBankInfo = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shop_id, shop_number, bank_name, card_number, account_number } =
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
    if (bank_name) {
      query.push({
        $match: { "bankInfo.bankName": { $regex: bank_name, $options: "i" } },
      });
    }
    if (card_number) {
      query.push({ $match: { "bankInfo.cardNumber": card_number } });
    }
    if (account_number) {
      query.push({ $match: { "bankInfo.accountNumber": account_number } });
    }
    query.push({ $sort: { balance: -1 } });
    query.push({
      $project: {
        userId: 1,
        shopName: 1,
        ownerFName: 1,
        ownerLName: 1,
        bankInfo: 1,
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
export const updateBankInfo = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const { shop_id, shop_number, card_number, account_number } = req.body;
    if (!shop_id && !shop_number)
      throw { message: `Shop Id Or Shop Owner's Number Is Required` };
    const findShop = shop_id
      ? await shopModel.findById(shop_id)
      : await shopModel.findOne({ userId: shop_number });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    if (!card_number) throw { message: `Card Number Is a Required Field` };
    if (!account_number)
      throw { message: `Account Number Is a Required Field` };
    if (!verifyCardNumber(card_number))
      throw { message: `Your Card Number Is Not Valid` };
    if (!isShebaValid(`IR${account_number}`))
      throw { message: `Your Account Number Is Not Valid` };
    await shopModel.updateOne(
      { userId: findShop.userId },
      {
        $set: {
          bankInfo: {
            cardNumber: card_number,
            accountNumber: account_number,
            bankName: getBankNameFromCardNumber(card_number),
          },
        },
      }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Updating Bank Info Of Shop With Id: ${findShop._id} And Number: ${findShop.userId}`,
      operationMethod: "UPDATEBANK",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res
      .status(200)
      .json({ status: 200, message: `Your Bank Info Updated`, success: true });
  } catch (err) {
    return next({ status: 400, err });
  }
};
