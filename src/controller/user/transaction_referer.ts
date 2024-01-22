import { Response, NextFunction } from "express";
import { userReqInt } from "../../module/interfaces";
import { userModel } from "../../model/userModel";
import { userTransModel } from "../../model/transactionsModel";
import { PipelineStage } from "mongoose";

// READ
export const getTransactions = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    let { transaction_status, id, page } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    const findUser = await userModel.findOne({ userId });
    if (!findUser) throw { status: 404, message: `User Not Found` };
    if (id) {
      const findTrans = await userTransModel.findById(id);
      return res.status(200).json(findTrans);
    }
    if (transaction_status && transaction_status.length !== 0) {
      const statuses = Array.isArray(transaction_status)
        ? transaction_status
        : [transaction_status];
      const fixCaseSens = statuses.map((item) => String(item).toUpperCase());
      const findTrans = await userTransModel.aggregate([
        {
          $match: {
            _id: {
              $in: findUser.transactions,
            },
            transactionStat: { $in: fixCaseSens },
          },
        },
        {$sort: {date: -1}},
        { $skip: (pageNumber - 1) * perPage },
        { $limit: perPage },
      ]);
      if (findTrans.length === 0) {
        pageNumber = 1;
        const fixFindTrans = await userTransModel.aggregate([
          {
            $match: {
              _id: {
                $in: findUser.transactions,
              },
              transactionStat: { $in: fixCaseSens },
            },
          },
          {$sort: {date: -1}},
          { $skip: (pageNumber - 1) * perPage },
          { $limit: perPage },
        ]);
        return res.status(200).json(fixFindTrans);
      }
      return res.status(200).json(findTrans);
    }
    if (!id && !transaction_status) {
      const findTrans = await userTransModel.aggregate([
        { $match: { _id: { $in: findUser.transactions } } },
        { $skip: (pageNumber - 1) * perPage },
        { $limit: perPage },
      ]);
      return res.status(200).json(findTrans);
    } else throw { status: 404, message: `Order Not Found` };
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
    const referer = await userModel.findOne({ userId }, { refer: 1 });
    if (!referer) throw { status: 404, message: `Referer Code Not Found` };
    return res.status(200).json(referer);
  } catch (err) {
    return next({ status: 400, err });
  }
};