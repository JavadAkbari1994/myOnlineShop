import { NextFunction, Response } from "express";
import { userReqInt } from "../../../module/interfaces";
import { operationsModel } from "../../../model/operationsModel";
import { PipelineStage, isValidObjectId } from "mongoose";
import { userModel } from "../../../model/userModel";

// READ
export const getOperations = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    let { id, admin_name, page, operation_method, admin_id } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    let query: PipelineStage[] = [];
    if (id) {
      if (!isValidObjectId(id))
        throw { status: 404, message: `Operation Not Found` };
      const findOperation = await operationsModel.findById(id);
      if (!findOperation) throw { status: 404, message: `Operation Not Found` };
      return res.status(200).json(findOperation);
    }
    if (admin_id) {
      query.push({ $match: { adminId: admin_id } });
    }
    if (admin_name) {
      query.push({
        $match: { adminName: { $regex: admin_name, $options: "i" } },
      });
    }
    if (operation_method && operation_method.length !== 0) {
      const methods = Array.isArray(operation_method)
        ? operation_method
        : [operation_method];
      const fixCaseSens = methods.map((item) => String(item).toUpperCase());
      query.push({ $match: { operationMethod: { $in: fixCaseSens } } });
    }
    query.push({ $sort: { date: -1 } });
    query.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0 } });
    const findOperation = await operationsModel.aggregate(query);
    const maxPages = Math.ceil(findOperation.length / perPage);
    if (pageNumber > maxPages) pageNumber = 1;
    query.push({ $skip: (pageNumber - 1) * perPage });
    query.push({ $limit: perPage });
    const result = await operationsModel.aggregate(query);
    if (findOperation.length > 0) {
      return res.status(200).json(result);
    } else {
      const allOperations = await operationsModel.find(
        {},
        { createdAt: 0, updatedAt: 0, __v: 0 }
      );
      return res.status(404).json(allOperations);
    }
  } catch (err) {
    return next({ status: 400, err });
  }
};
