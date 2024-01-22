import { NextFunction, Response } from "express";
import {
  availableCities,
  updateAddressInt,
  userReqInt,
} from "../../../module/interfaces";
import { shopModel } from "../../../model/shopModel";
import { userModel } from "../../../model/userModel";
import { operationsModel } from "../../../model/operationsModel";
import { PipelineStage, isValidObjectId } from "mongoose";

// CREATE
export const addAddress = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const { req_shop_id, shop_number, title, city, main_street, details } =
      req.body;
    if (!req_shop_id && !shop_number)
      throw { status: 404, message: `Shop Not Found` };
    const findShop = req_shop_id
      ? await shopModel.findById(req_shop_id)
      : await shopModel.findOne({ userId: shop_number });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    if (!city) throw { message: `City Is a Required Field` };
    if (!Object.values(availableCities).includes(city.toLowerCase()))
      throw { status: 403, message: `City Is Not Valid` };
    if (!main_street) throw { message: `Main Street Is a Required Field` };
    if (!details) throw { message: `Details Is a Required Field` };
    await shopModel.updateOne(
      { userId: findShop.userId },
      {
        $push: {
          addresses: {
            title,
            city: city.toLowerCase(),
            mainStreet: main_street,
            details,
          },
        },
      }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Add Address To Shop Profile`,
      operationMethod: "ADDADDRESS",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(201).json({
      status: 201,
      message: `Address Added To Your Profile`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// READ
export const getAddresses = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    let { shop_id, shop_number, title } = req.body;
    const findShop = shop_id
      ? await shopModel.findById(shop_id)
      : await shopModel.findOne({ userId: shop_number });
    const { page } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    let query: PipelineStage[] = [];
    if (!findShop) {
      query.push({ $project: { addresses: 1 } });
    }
    if (findShop) {
      if (shop_id) {
        query.push({ $match: { _id: findShop._id } });
      }
      if (shop_number) {
        query.push({ $match: { userId: shop_number } });
      }
      query.push({ $project: { addresses: 1 } });
    }
    query.push({ $unwind: "$addresses" });
    if (title) {
      query.push({
        $match: { "addresses.title": { $regex: title, $options: "i" } },
      });
    }
    query.push({ $sort: { createdAt: -1 } });
    const findAddress = await shopModel.aggregate(query);
    const maxPages = Math.ceil(findAddress.length / perPage);
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
export const updateAddress = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const {
      shop_id,
      address_id,
      shop_number,
      title,
      city,
      main_street,
      details,
    } = req.body;
    if (!shop_id && !shop_number) throw { message: `Shop Id Is Required` };
    if (!address_id) throw { message: `Address Id Is Required ` };
    let updateFields: updateAddressInt = {};
    if (city && Object.values(availableCities).includes(city.toLowerCase())) {
      updateFields.city = city.toLowerCase();
    }
    if (main_street) {
      updateFields.mainStreet = main_street;
    }
    if (details) {
      updateFields.details = details;
    }
    if (title) {
      updateFields.title = title;
    }
    updateFields._id = address_id;
    const findShop = shop_id
      ? await shopModel.findById(shop_id)
      : await shopModel.findOne({ userId: shop_number });
    const addressIds = findShop.addresses
      .map((item) => item._id)
      .join(",")
      .split(",");
    if (!addressIds.includes(address_id))
      throw { status: 404, message: `Address Not Found` };
    await shopModel.updateOne(
      { userId: findShop.userId },
      { $pull: { addresses: { _id: address_id } } }
    );
    await shopModel.updateOne(
      { userId: findShop.userId },
      { $push: { addresses: updateFields } }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Update Address For Shop With Id: ${findShop._id} And Address Id: ${address_id}`,
      operationMethod: "UPDATEADDRESS",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(200).json({
      status: 200,
      message: `Your Address Updated Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// DELETE
export const deleteAddress = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const { shop_id, shop_number, address_id } = req.body;
    if (!shop_id && !shop_number) throw { message: `Shop Id Is Required` };
    if (!address_id) throw { message: `Address Id Is Required` };
    const findShop = shop_id
      ? await shopModel.findById(shop_id)
      : await shopModel.findOne({ userId: shop_number });
    const addressIds = findShop.addresses
      .map((item) => item._id)
      .join(",")
      .split(",");
    if (!addressIds.includes(address_id))
      throw { status: 404, message: `Address Not Found` };
    await shopModel.updateOne(
      { userId: findShop.userId },
      { $pull: { addresses: { _id: address_id } } }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Delete Address For Shop With Id: ${findShop._id} And Number: ${findShop.userId}`,
      operationMethod: "DELETEADDRESS",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res
      .status(200)
      .json({ status: 200, message: `Address Deleted`, success: true });
  } catch (err) {
    return next({ status: 400, err });
  }
};
