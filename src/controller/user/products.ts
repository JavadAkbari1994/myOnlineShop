import { NextFunction, Response } from "express";
import { userReqInt } from "../../module/interfaces";
import { productModel } from "../../model/productModel";
import { PipelineStage, isValidObjectId } from "mongoose";
import { serviceModel } from "../../model/serviceModel";
import { shopModel } from "../../model/shopModel";

// READ
export const getProducts = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      product_id,
      service,
      cat,
      sub_cat,
      shop_id,
      title,
      price,
      min_price,
      max_price,
    } = req.body;
    const { page } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    let query: PipelineStage[] = [];
    if (product_id && isValidObjectId(product_id)) {
      const findProduct = await productModel.findById(product_id);
      if (findProduct) {
        query.push({ $match: { _id: findProduct._id } });
      }
    }
    const findService = service
      ? await serviceModel.findById(service)
      : cat && !sub_cat
      ? await serviceModel.findOne({
          category: { $regex: cat, $options: "i" },
        })
      : await serviceModel.findOne({
          category: { $regex: cat, $options: "i" },
          subCategory: { $regex: sub_cat, $options: "i" },
        });
    if (service) {
      query.push({ $match: { service: { _id: findService._id } } });
    }
    if (cat) {
      query.push({ $match: { "service.category": findService.category } });
    }
    if (sub_cat) {
      query.push({
        $match: { "service.subCategory": findService.subCategory },
      });
    }
    if (shop_id && isValidObjectId(shop_id)) {
      const findShop = await shopModel.findById(shop_id);
      if (findShop) {
        query.push({ $match: { shopId: findShop._id } });
      }
    }
    if (title) {
      query.push({ $match: { title: { $regex: title, $options: "i" } } });
    }
    if (price) {
      query.push({ $match: { price: +price } });
    }
    if (min_price && !price) {
      query.push({ $match: { price: { $gte: +min_price } } });
    }
    if (max_price && !price) {
      query.push({ $match: { price: { $lte: +max_price } } });
    }
    query.push({ $match: { isAvailable: true } });
    query.push({ $match: { isConfirmed: true } });
    query.push({ $sort: { createdAt: -1 } });
    query.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0 } });
    const findProduct = await productModel.aggregate(query);
    const maxPages = Math.ceil(findProduct.length / perPage);
    if (pageNumber > maxPages) pageNumber = 1;
    query.push({ $skip: (pageNumber - 1) * perPage });
    query.push({ $limit: perPage });
    const result = await productModel.aggregate(query);
    if (findProduct.length) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json({
        status: 404,
        message: `No Product With Your Description Was Found`,
      });
    }
  } catch (err) {
    return next({ status: 400, err });
  }
};
