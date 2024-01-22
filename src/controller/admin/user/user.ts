import { NextFunction, Response } from "express";
import { userReqInt } from "../../../module/interfaces";
import { userModel } from "../../../model/userModel";
import { PipelineStage, isValidObjectId } from "mongoose";
import { operationsModel } from "../../../model/operationsModel";
import { referGen } from "../../../module/utils";
import { updateProfileSchema } from "../../../validations/updateProfileSchema";
import { signupSchema } from "../../../validations/signUpAndLoginSchema";

// CREATE
export const createUser = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const { user_number, first_name, last_name } = req.body;
    if (!first_name) throw { message: `User's First Name Is a Required Field` };
    if (!last_name) throw { message: `User's Last Name Is a Required Field` };
    const findUser = await userModel.findOne({ userId: user_number });
    if (findUser)
      throw {
        status: 403,
        message: `This User Already Exists`,
      };
    await updateProfileSchema.validate(
      { fName: first_name, lName: last_name },
      { abortEarly: false }
    );
    await signupSchema.validate({ userId: user_number });
    const createNewUser = await userModel.create({
      userId: user_number,
      fName: first_name.toLowerCase(),
      lName: last_name.toLowerCase(),
      referer: `localhost:3000/refer?referrer=${referGen()}`,
    });
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Create User With User Id: ${user_number} And Id: ${createNewUser._id}`,
      operationMethod: "CREATEUSER",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(201).json({
      status: 201,
      message: `User Created Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// READ
export const getUsers = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id, user_number, first_name, last_name } = req.body;
    const { page } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    let query: PipelineStage[] = [];
    if (!user_id && !user_number && !first_name && !last_name) {
      const allUsers = await userModel.find(
        {},
        { userId: 1, _id: 1, fName: 1, lName: 1, email: 1 }
      );
      return res.status(200).json(allUsers);
    }
    if (user_id) {
      query.push({ $match: { _id: user_id } });
    }
    if (user_number) {
      query.push({ $match: { userId: user_number } });
    }
    if (first_name) {
      query.push({
        $match: { fName: { $regex: first_name, $options: "i" } },
      });
    }
    if (last_name) {
      query.push({
        $match: { lName: { $regex: last_name, $options: "i" } },
      });
    }
    query.push({ $sort: { createdAt: -1 } });
    query.push({
      $project: {
        userId: 1,
        _id: 1,
        fName: 1,
        lName: 1,
        email: 1,
        balance: 1,
        addresses: 1,
        transactions: 1,
        orders: 1,
      },
    });
    const findUser = await userModel.aggregate(query);
    const maxPages = Math.ceil(findUser.length / perPage);
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
export const updateUser = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `User Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const { user_id, user_number, first_name, last_name, email } = req.body;
    if (!user_id && !user_number)
      throw { message: `User Id Or Phone Number Is Required` };
    if (!first_name) throw { message: `First Name Is Required` };
    if (!last_name) throw { message: `Last Name Is Required` };
    if (!email) throw { message: `Email Is Required` };
    await updateProfileSchema.validate(
      { fName: first_name, lName: last_name, email },
      { abortEarly: false }
    );
    const findUser = user_id
      ? await userModel.findById(user_id)
      : await userModel.findOne({ userId: user_number });
    if (!findUser) throw { status: 404, message: `User Not Found` };
    await userModel.updateOne(
      { userId: findUser.userId },
      {
        $set: {
          fName: first_name.toLowerCase(),
          lName: last_name.toLowerCase(),
          email: email.toLowerCase(),
        },
      }
    );
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Update User Profile With Number ${findUser.userId}`,
      operationMethod: "UPDATEUSER",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(200).json({
      status: 200,
      message: `User Updated Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// DELETE
export const deleteUser = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `User Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `User Not Found` };
    const { user_id, user_number } = req.body;
    if (!user_id && !user_number)
      throw { status: 404, message: `User Not Found` };
    const findUser = user_id
      ? await userModel.findById(user_id)
      : await userModel.findOne({ userId: user_number });
    if (!findUser) throw { status: 404, message: `User Not Found` };
    await userModel.deleteOne({ userId: findUser.userId });
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Delete User With User Id: ${findUser.userId}`,
      operationMethod: "DELETEUSER",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(200).json({
      status: 200,
      message: `User Deleted Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};
