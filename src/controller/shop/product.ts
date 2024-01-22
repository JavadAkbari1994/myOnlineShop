import { Response, NextFunction } from "express";
import { updateProdInt, userReqInt } from "../../module/interfaces";
import { shopModel } from "../../model/shopModel";
import { PipelineStage, isValidObjectId } from "mongoose";
import { productModel } from "../../model/productModel";
import { serviceModel } from "../../model/serviceModel";
import { userModel } from "../../model/userModel";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

// CREATE
export const addProduct = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const findShop = await shopModel.findOne({ userId });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    const { service, title, price, details, isAvailable } = req.body;
    const imagePath = req.file?.path || "";
    if (!service || !isValidObjectId(service))
      throw { message: `Service Is a Required Field` };
    const findService = await serviceModel.findById(service);
    if (!findService) throw { status: 404, message: `Service Not Found` };
    if (!title) throw { message: `Title Is a Required Field` };
    if (!price) throw { message: `Price Is a Required Field` };
    if (!details) throw { message: `Details Is a Required Field` };
    if (isAvailable == undefined || isAvailable == "" || isAvailable == null)
      throw {
        message: `You Should Determine That The Product Is Available Or Not`,
      };
    const product = await productModel.create({
      shopId: findShop._id,
      service: {
        _id: findService._id,
        category: findService.category,
        subCategory: findService.subCategory,
      },
      image: { url: imagePath, date: Date.now() },
      title,
      price: +price,
      details,
      isAvailable,
    });
    await shopModel.updateOne(
      { userId: findShop.userId },
      {
        $push: { products: { _id: product._id } },
      }
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
      all_products,
      product_id,
      is_available,
      is_confirmed,
      title,
      price,
      min_price,
      max_price,
    } = req.body;
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Shop Not Found` };
    const findShop = await shopModel.findOne({ userId });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    const { page } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    let query: PipelineStage[] = [];
    if (all_products === true || all_products === "true") {
      const allProducts = await productModel
        .find({ shopId: findShop._id })
        .skip((pageNumber - 1) * perPage)
        .limit(perPage);
      return res.status(200).json(allProducts);
    }
    if (product_id && isValidObjectId(product_id)) {
      const productId = product_id as string | undefined;
      let productObjectId: ObjectId | undefined = new ObjectId(
        productId
      ) as ObjectId;
      query.push({ $match: { products: productObjectId } });
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
    if (result.length !== 0) {
      return res.status(200).json(result);
    } else {
      return res
        .status(404)
        .json({ status: 404, message: `Nothing Found`, success: false });
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
      cat,
      sub_cat,
      title,
      price,
      details,
      isAvailable,
    } = req.body;
    const imagePath = req.file?.path || "";
    if (!product_id || !isValidObjectId(product_id))
      throw { status: 404, message: `Product Not Found` };
    const findProduct = await productModel.findById(product_id);
    if (!findProduct) throw { message: `Product Not Found` };
    const findService = service
      ? await serviceModel.findById(service)
      : await serviceModel.findOne({
          category: cat.toLowerCase(),
          subCategory: sub_cat.toLowerCase(),
        });
    let updateFields: updateProdInt = {};
    if (imagePath && imagePath !== "") {
      updateFields.image = { url: imagePath, date: Date.now() };
    }
    if (findService) {
      updateFields.service._id = findService._id;
      updateFields.service.category = findService.category;
      updateFields.service.subCategory = findService.subCategory;
    }
    if (title) updateFields.title = title;
    if (price) updateFields.price = +price;
    if (details) updateFields.details = details;
    if (
      isAvailable !== undefined &&
      isAvailable !== null &&
      isAvailable !== ""
    ) {
      updateFields.isAvailable = isAvailable;
    } else {
      updateFields.isAvailable = false;
    }
    updateFields.isConfirmed = false;
    if (imagePath && findProduct.image.url) {
      fs.unlinkSync(path.join(findProduct.image.url));
    }
    await productModel.updateOne(
      { _id: findProduct._id },
      { $set: updateFields }
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
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Shop Not Found` };
    const findShop = await shopModel.findOne({ userId });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    const { product_id } = req.body;
    if (!product_id && !isValidObjectId(product_id))
      throw { status: 404, message: `Product Not Found` };
    const findProduct = await productModel.findById(product_id);
    if (!findProduct) throw { status: 404, message: `Product Not Found` };
    if (!findShop.products.includes(product_id))
      throw {
        status: 403,
        message: `This Product Does Not Belong In This Shop`,
      };
    const imageUrl = findProduct.image.url;
    if (imageUrl && fs.existsSync(path.join(imageUrl))) {
      fs.unlinkSync(path.join(imageUrl));
    }
    await shopModel.findByIdAndUpdate(findProduct.shopId, {
      $pull: { products: findProduct._id },
    });
    await productModel.findByIdAndDelete(product_id);
    return res
      .status(200)
      .json({ status: 200, message: `Product Deleted`, success: true });
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
    if (!userId) throw { status: 404, message: `Shop Not Found` };
    const findShop = await shopModel.findOne({ userId });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    const { product_id } = req.body;
    if (!product_id) throw { status: 404, message: `Product Not Found` };
    const findProduct = await productModel.findById(product_id);
    if (!findProduct) throw { status: 404, message: `Product Not Found` };
    if (String(findProduct.shopId) !== String(findShop._id))
      throw {
        status: 403,
        message: `You Can Not Delete Images From Other Shops`,
      };
    const imageUrl = findProduct.image.url;
    if (!imageUrl) throw { message: `This Product Has No Image` };
    if (fs.existsSync(path.join(imageUrl))) {
      fs.unlinkSync(path.join(imageUrl));
    }
    await productModel.updateOne(
      { _id: findProduct._id },
      { $set: { image: { url: "", date: "" } } }
    );
    return res
      .status(200)
      .json({ status: 200, message: `Product Image Successfully Deleted` });
  } catch (err) {
    return next({ status: 400, err });
  }
};
