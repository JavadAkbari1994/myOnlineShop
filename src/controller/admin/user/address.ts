import { NextFunction, Response } from "express";
import {
  availableCities,
  updateAddressInt,
  userReqInt,
} from "../../../module/interfaces";
import { userModel } from "../../../model/userModel";
import { operationsModel } from "../../../model/operationsModel";
import { PipelineStage } from "mongoose";

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
    const { user_id, user_number, title, city, main_street, details } =
      req.body;
    if (!user_id && !user_number)
      throw { status: 404, message: `User Not Found` };
    const findUser = user_id
      ? await userModel.findById(user_id)
      : await userModel.findOne({ userId: user_number });
    if (!findUser) throw { status: 404, message: `User Not Found` };
    if (!city) throw { message: `City Is a Required Field` };
    if (!Object.values(availableCities).includes(city.toLowerCase()))
      throw { status: 403, message: `City Is Not Valid` };
    if (!main_street) throw { message: `Main Street Is a Required Field` };
    if (!details) throw { message: `Details Is a Required Field` };
    await userModel.updateOne(
      { userId: findUser.userId },
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
      operationInfo: `Add Address To User Profile`,
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
    let { user_id, user_number, title } = req.body;
    const findUser = user_id
      ? await userModel.findById(user_id)
      : await userModel.findOne({ userId: user_number });
    const { page } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    let query: PipelineStage[] = [];
    if (!findUser) {
      query.push({ $project: { addresses: 1 } });
    }
    if (findUser) {
      if (user_id) {
        query.push({ $match: { _id: findUser._id } });
      }
      if (user_number) {
        query.push({ $match: { userId: user_number } });
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
    const findAddress = await userModel.aggregate(query);
    const maxPages = Math.ceil(findAddress.length / perPage);
    if (pageNumber > maxPages) pageNumber = 1;
    query.push({ $skip: (pageNumber - 1) * perPage });
    query.push({ $limit: perPage });
    const result = await userModel.aggregate(query);
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
      user_id,
      address_id,
      user_number,
      title,
      city,
      main_street,
      details,
    } = req.body;
    if (!user_id && !user_number) throw { message: `User Id Is Required` };
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
    const findUser = user_id
      ? await userModel.findById(user_id)
      : await userModel.findOne({ userId: user_number });
    const addressIds = findUser.addresses
      .map((item) => item._id)
      .join(",")
      .split(",");
    if (!addressIds.includes(address_id))
      throw { status: 404, message: `Address Not Found` };
    await userModel.updateOne(
      { userId: findUser.userId },
      { $pull: { addresses: { _id: address_id } } }
    );
    await userModel.updateOne(
      { userId: findUser.userId },
      { $push: { addresses: updateFields } }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Update Address For User With Id: ${findUser._id} And Address Id: ${address_id}`,
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
    const { user_id, user_number, address_id } = req.body;
    if (!user_id && !user_number) throw { message: `User Id Is Required` };
    if (!address_id) throw { message: `Address Id Is Required` };
    const findUser = user_id
      ? await userModel.findById(user_id)
      : await userModel.findOne({ userId: user_number });
    const addressIds = findUser.addresses
      .map((item) => item._id)
      .join(",")
      .split(",");
    if (!addressIds.includes(address_id))
      throw { status: 404, message: `Address Not Found` };
    await userModel.updateOne(
      { userId: findUser.userId },
      { $pull: { addresses: { _id: address_id } } }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Delete Address For User With Id: ${findUser._id} And Number: ${findUser.userId}`,
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
