import { Response, NextFunction } from "express";
import {
  availableCities,
  updateShopInt,
  userReqInt,
} from "../../../module/interfaces";
import { PipelineStage, isValidObjectId } from "mongoose";
import { shopModel } from "../../../model/shopModel";
import { userModel } from "../../../model/userModel";
import { operationsModel } from "../../../model/operationsModel";
import { serviceSignupSchema } from "../../../validations/serviceSignupSchema";
import { referGen } from "../../../module/utils";
import { serviceModel } from "../../../model/serviceModel";
import { updateProfileSchema } from "../../../validations/updateProfileSchema";
import { verifyIranianNationalId } from "@persian-tools/persian-tools";
import { productModel } from "../../../model/productModel";
import { transModel } from "../../../model/transactionsModel";
import { ordersModel } from "../../../model/ordersModel";
import fs from "fs";
import path from "path";

// CREATE
export const createShop = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `User Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const {
      shop_number,
      service,
      cat,
      sub_cat,
      first_name,
      last_name,
      shop_name,
      city,
      activation_status,
      referer,
    } = req.body;
    if (!shop_number)
      throw { message: `Shop Owner's Phone Number Is Required` };
    const isBoolean =
      /^(true)$/i.test(activation_status.toLowerCase()) ||
      /^(false)$/i.test(activation_status.toLowerCase());
    if (isBoolean == false) throw { message: `Activation Status Is Not Valid` };
    if (!service && !cat && !sub_cat)
      throw { message: `Category Is a Required Field` };
    const findService = service
      ? await serviceModel.findById(service)
      : await serviceModel.findOne({
          category: cat.toLowerCase(),
          subCategory: sub_cat.toLowerCase(),
        });
    if (!city) throw { message: `City Is a Required Field` };
    if (!Object.values(availableCities).includes(city.toLowerCase()))
      throw { status: 403, message: `City Is Not Supported` };
    if (!shop_name) throw { message: `Shop Name Is a Required Field` };
    if (!first_name)
      throw { message: `Owner's First Name Is a Required Field` };
    if (!last_name) throw { message: `Owner's Last Name Is a Required Field` };
    await serviceSignupSchema.validate({ userId: shop_number });
    const findShop = await shopModel.findOne({ userId: shop_number });
    if (findShop)
      throw {
        status: 403,
        message: `This Shop Already Exists`,
      };
    const createNewShop = await shopModel.create({
      service: {
        _id: findService._id,
        category: findService.category,
        subCategory: findService.subCategory,
      },
      city: city.toLowerCase(),
      shopName: shop_name,
      ownerFName: first_name,
      ownerLName: last_name,
      userId: shop_number,
      isActive: activation_status.toLowerCase(),
      referer: `localhost:3000/refer?referrer=${referGen()}`,
    });
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Create Shop With Owner Id: ${shop_number} And Id: ${createNewShop._id}`,
      operationMethod: "CREATESHOP",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    if (referer) {
      const findShop = await shopModel.findOne({ referer });
      if (!findShop) throw { message: `Referer Code Is Not Valid` };
      await shopModel.updateOne(
        { referer },
        {
          $push: {
            promote: `Shop ${shop_name} Signed Up With Your Refer Code`,
          },
        }
      );
    }
    return res.status(201).json({
      status: 201,
      message: `Shop Created Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// READ
export const getShop = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      shop_id,
      shop_number,
      shop_name,
      owner_first_name,
      owner_last_name,
      city,
      service,
      cat,
      sub_cat,
      activation_status,
    } = req.body;
    const { page } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    let query: PipelineStage[] = [];
    if (shop_id) {
      query.push({ $match: { _id: shop_id } });
    }
    if (shop_number) {
      query.push({ $match: { userId: shop_number } });
    }
    if (shop_name) {
      query.push({ $match: { shopName: shop_name } });
    }
    if (owner_first_name) {
      query.push({
        $match: { ownerFName: { $regex: owner_first_name, $options: "i" } },
      });
    }
    if (owner_last_name) {
      query.push({
        $match: { ownerLName: { $regex: owner_last_name, $options: "i" } },
      });
    }
    if (service) {
      const findService = await serviceModel.findById(service);
      query.push({ $match: { service: findService._id } });
    }
    if (cat)
      query.push({
        $match: { "service.category": { $regex: cat, $options: "i" } },
      });
    if (sub_cat)
      query.push({
        $match: {
          service: { subCategory: { $regex: sub_cat, $options: "i" } },
        },
      });
    if (city) {
      query.push({ $match: { city: { $regex: city, $options: "i" } } });
    }
    if (activation_status) {
      const stat = activation_status.toLowerCase();
      if (stat === "true") {
        query.push({ $match: { isActive: true } });
      }
      if (stat === "false") {
        query.push({ $match: { isActive: false } });
      }
    }
    query.push({ $sort: { createdAt: 1 } });
    query.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0 } });
    const findShop = await shopModel.aggregate(query);
    const maxPages = Math.ceil(findShop.length / perPage);
    if (pageNumber > maxPages) pageNumber = 1;
    query.push({ $skip: (pageNumber - 1) * perPage });
    query.push({ $limit: perPage });
    const result = await shopModel.aggregate(query);
    return res.status(200).json(result);
  } catch (err) {
    return next({ status: 400, err });
  }
};

// UPDATE
export const updateShop = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `User Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const {
      shop_id,
      shop_number,
      shop_name,
      owner_first_name,
      owner_last_name,
      email,
      national_id,
    } = req.body;
    if (!shop_id && !shop_number)
      throw { message: `Shop Id Or Number Is Required` };
    const findShop = shop_id
      ? await shopModel.findById(shop_id)
      : await shopModel.findOne({ userId: shop_number });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    let updateFields: updateShopInt = {};
    if (shop_name) {
      updateFields.shopName = shop_name;
    }
    if (owner_first_name) {
      await updateProfileSchema.validate({ fName: owner_first_name });
      updateFields.ownerFName = owner_first_name;
    }
    if (owner_last_name) {
      await updateProfileSchema.validate({ lName: owner_last_name });
      updateFields.ownerLName = owner_last_name;
    }
    if (email) {
      await updateProfileSchema.validate({ email });
      updateFields.email = email;
    }
    if (national_id && verifyIranianNationalId(national_id)) {
      updateFields.nationalId = national_id;
    }
    await shopModel.updateOne(
      { userId: findShop.userId },
      { $set: updateFields }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Update Shop With Id: ${findShop._id} And Number: ${findShop.userId}`,
      operationMethod: "UPDATESHOP",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(200).json({
      status: 200,
      message: `Shop Updated Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// DELETE
export const deleteShop = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `User Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `User Not Found` };
    const { shop_id, shop_number } = req.body;
    if (!shop_id && !shop_number)
      throw { status: 404, message: `Shop Not Found` };
    const findShop = shop_id
      ? await shopModel.findById(shop_id)
      : await shopModel.findOne({ userId: shop_number });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    if (findShop.image.icon.url) {
      fs.unlinkSync(path.join(findShop.image.icon.url))
    }
    if (findShop.image.wallpaper.url) {
      fs.unlinkSync(path.join(findShop.image.wallpaper.url))
    }
    await shopModel.deleteOne({ userId: findShop.userId });
    await productModel.deleteMany({ shopId: findShop._id });
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Shop With Owner Id: ${findShop.userId} And Name: ${findShop.shopName} Successfully Removed`,
      operationMethod: "DELETESHOP",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res
      .status(200)
      .json({ status: 200, message: `Shop Deleted`, success: true });
  } catch (err) {
    return next({ status: 400, err });
  }
};
