import { Response, NextFunction } from "express";
import { userReqInt } from "../../module/interfaces";
import { shopModel } from "../../model/shopModel";
import { transModel } from "../../model/transactionsModel";
import { PipelineStage, isValidObjectId } from "mongoose";

// READ
export const getTransactions = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    let {
      trans_number,
      page,
      amount,
      max_amount,
      min_amount,
      description,
      transaction_status,
    } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Shop Not Found` };
    const findShop = await shopModel.findOne({ userId });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    let query: PipelineStage[] = [];
    if (findShop) {
      query.push({ $match: { shopId: findShop._id } });
    }
    if (trans_number) {
      const findTrans = await transModel.findOne({
        transactionNumber: trans_number,
      });
      if (findTrans) {
        query.push({ $match: { transactionNumber: trans_number } });
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
    const findTrans = await transModel.aggregate(query);
    const maxPages = Math.ceil(findTrans.length / perPage);
    if (pageNumber > maxPages) pageNumber = 1;
    query.push({ $skip: (pageNumber - 1) * perPage });
    query.push({ $limit: perPage });
    const result = await transModel.aggregate(query);
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

// READ
export const getReferer = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const referer = await shopModel.findOne({ userId }, { refer: 1 });
    if (!referer) throw { status: 404, message: `Referer Code Not Found` };
    return res.status(200).json(referer);
  } catch (err) {
    return next({ status: 400, err });
  }
};
