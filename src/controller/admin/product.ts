import { Response, NextFunction } from "express";
import { updateProdInt, userReqInt } from "../../module/interfaces";
import { userModel } from "../../model/userModel";
import { PipelineStage, isValidObjectId } from "mongoose";
import { productModel } from "../../model/productModel";
import { operationsModel } from "../../model/operationsModel";
import { shopModel } from "../../model/shopModel";
import { serviceModel } from "../../model/serviceModel";
import fs from "fs";
import path from "path";

// CREATE
export const addProduct = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      req_shop_number,
      service,
      cat,
      sub_cat,
      title,
      price,
      details,
      isAvailable,
    } = req.body;
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const imagePath = req.file?.path || "";
    if (!req_shop_number) throw { status: 404, message: `Shop Not Found` };
    const findShop = await shopModel.findOne({ userId: req_shop_number });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    if (!title || !price || !details) throw { message: `Inputs Are Not Valid` };
    if (!service && !cat) throw { message: `Service Is a Required Field` };
    const findService = service
      ? await serviceModel.findById(service)
      : await serviceModel.findOne({
          category: cat.toLowerCase(),
          subCategory: sub_cat.toLowerCase(),
        });
    if (!findService) throw { message: `Service Is Not Valid` };
    const product = await productModel.create({
      service: {
        _id: findService._id,
        category: findService.category,
        subCategory: findService.subCategory,
      },
      shopId: findShop._id,
      image: { url: imagePath, date: Date.now() },
      title,
      price,
      details,
      isAvailable,
      isConfirmed: true,
    });
    await shopModel.updateOne(
      { userId: findShop.userId },
      { $push: { products: { _id: product._id } } }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Add Product With Id: ${product._id} For Shop With Id: ${findShop._id}`,
      operationMethod: "ADDPRODUCT",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: { _id: newOperation._id } } }
    );
    return res.status(201).json({
      status: 201,
      message: `Product Added Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

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
      is_available,
      is_confirmed,
      title,
      price,
      min_price,
      max_price,
    } = req.body;
    const { page } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    if (product_id) {
      const findProduct = await productModel.findById(product_id);
      if (!findProduct) throw { status: 404, message: `Product Not Found` };
      return res.status(200).json(findProduct);
    }
    let query: PipelineStage[] = [];
    if (service && isValidObjectId(service)) {
      const findService = await serviceModel.findById(service);
      if (findService) {
        query.push({ $match: { service: findService._id } });
      }
    }
    if (cat && !service) {
      query.push({
        $match: { "service.category": { $regex: cat, $options: "i" } },
      });
    }
    if (sub_cat && !service) {
      query.push({
        $match: { "service.subCategory": { $regex: sub_cat, $options: "i" } },
      });
    }
    if (shop_id && isValidObjectId(shop_id)) {
      const findShop = await shopModel.findById(shop_id);
      if (findShop) {
        query.push({ $match: { shopId: findShop._id } });
      }
    }
    if (
      is_available !== undefined &&
      is_available !== null &&
      is_available !== ""
    ) {
      query.push({ $match: { isAvailable: is_available } });
    }
    if (
      is_confirmed !== undefined &&
      is_confirmed !== null &&
      is_confirmed !== ""
    ) {
      query.push({ $match: { isConfirmed: is_confirmed } });
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
    query.push({ $sort: { createdAt: -1 } });
    query.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0 } });
    const findProduct = await productModel.aggregate(query);
    const maxPages = Math.ceil(findProduct.length / perPage);
    if (pageNumber > maxPages) pageNumber = 1;
    query.push({ $skip: (pageNumber - 1) * perPage });
    query.push({ $limit: perPage });
    const result = await productModel.aggregate(query);
    if (findProduct.length !== 0) {
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

// UPDATE
export const updateProduct = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      product_id,
      service,
      title,
      price,
      details,
      isAvailable,
      isConfirmed,
    } = req.body;
    const imagePath = req.file?.path || "";
    if (!product_id || !isValidObjectId(product_id))
      throw { status: 404, message: `Product Not Found` };
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const findProduct = await productModel.findById(product_id);
    if (!findProduct) throw { message: `Product Not Found` };
    let updateFields: updateProdInt = {};
    if (imagePath) {
      updateFields.image = { url: imagePath, date: Date.now() };
    }
    if (service && isValidObjectId(service)) {
      const findService = await serviceModel.findById(service);
      if (findService) {
        updateFields.service = service;
      }
    }
    if (title) updateFields.title = title;
    if (price) updateFields.price = +price;
    if (details) updateFields.details = details;
    if (isAvailable !== undefined && isAvailable !== null && isAvailable !== "")
      updateFields.isAvailable = isAvailable;
    if (
      isConfirmed !== undefined &&
      isConfirmed !== null &&
      isConfirmed !== ""
    ) {
      updateFields.isConfirmed = isConfirmed;
    } else {
      updateFields.isConfirmed = false;
    }
    if (imagePath && findProduct.image.url) {
      fs.unlinkSync(path.join(findProduct.image.url));
    }
    await productModel.updateOne(
      { _id: findProduct._id },
      { $set: updateFields }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Updating Product With Id: ${product_id} For Shop With Id: ${findProduct.shopId}`,
      operationMethod: "UPDATEPRODUCT",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(200).json({
      status: 200,
      message: `Product Updated Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// DELETE
export const deleteProduct = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { product_id } = req.body;
    if (!product_id || !isValidObjectId(product_id))
      throw { status: 404, message: `Product Not Found` };
    const findProduct = await productModel.findById(product_id);
    if (!findProduct) throw { status: 404, message: `Product Not Found` };
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const imageUrl = findProduct.image.url;
    if (imageUrl && fs.existsSync(path.join(imageUrl))) {
      fs.unlinkSync(path.join(imageUrl));
    }
    await productModel.findByIdAndDelete(product_id);
    await shopModel.findByIdAndUpdate(findProduct.shopId, {
      $pull: { products: findProduct._id },
    });
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Delete Product With Id: ${product_id} From Shop With Id: ${findProduct.shopId}`,
      operationMethod: "DELETEPRODUCT",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: { _id: newOperation._id } } }
    );
    return res.status(200).json({
      status: 200,
      message: `Product Deleted Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

export const deleteProductImage = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const { product_id } = req.body;
    if (!product_id) throw { status: 404, message: `Product Not Found` };
    const findProduct = await productModel.findById(product_id);
    if (!findProduct) throw { status: 404, message: `Product Not Found` };
    const imageUrl = findProduct.image.url;
    if (!imageUrl) throw { message: `This Product Has No Image` };
    if (fs.existsSync(path.join(imageUrl))) {
      fs.unlinkSync(path.join(imageUrl));
    }
    await productModel.updateOne(
      { _id: findProduct._id },
      { $set: { image: { url: "", date: "" } } }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Delete Product Image With Id: ${product_id} From Shop With Id: ${findProduct.shopId}`,
      operationMethod: "DELETEPRODUCTIMAGE",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: { _id: newOperation._id } } }
    );
    return res
      .status(200)
      .json({ status: 200, message: `Product Image Successfully Deleted` });
  } catch (err) {
    return next({ status: 400, err });
  }
};
