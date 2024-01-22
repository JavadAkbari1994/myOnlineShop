import { Response, NextFunction } from "express";
import { userReqInt } from "../../module/interfaces";
import { serviceModel } from "../../model/serviceModel";
import { PipelineStage, isValidObjectId } from "mongoose";
import { userModel } from "../../model/userModel";
import { operationsModel } from "../../model/operationsModel";
import path from "path";
import fs from "fs";

// CREATE
export const createCategory = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const { cat, sub_cat } = req.body;
    const imagePath = req.file?.path || "";
    if (!cat) throw { message: `Category Is a Required Field` };
    const findCat = await serviceModel.findOne({ category: cat });
    if (findCat && findCat.subCategory && !sub_cat)
      throw {
        status: 403,
        message: `You Have To Put a Sub Category Name For This Category`,
      };
    const findCategories = await serviceModel.findOne({
      category: cat,
      subCategory: sub_cat,
    });
    if (findCategories)
      throw { status: 403, message: `This Category Already Exists` };
    const createCat = await serviceModel.create({
      category: cat.toLowerCase(),
      subCategory: sub_cat.toLowerCase(),
      image: imagePath,
    });
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Adding Category With Id: ${createCat._id}`,
      operationMethod: "ADDCATEGORY",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    res.status(201).json({
      status: 201,
      message: `Category Successfully Created`,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// READ
export const getCategory = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    let { cat, sub_cat, id } = req.query;
    let query: PipelineStage[] = [];
    if (id) {
      if (!isValidObjectId(id))
        throw { status: 404, message: `Category Not Found` };
      const findCat = await serviceModel.findById(id);
      if (!findCat) throw { status: 404, message: `Category Not Found` };
      query.push({ $match: { _id: findCat._id } });
    }
    if (cat) {
      query.push({ $match: { category: { $regex: cat, $options: "i" } } });
    }
    if (sub_cat) {
      query.push({
        $match: { subCategory: { $regex: sub_cat, $options: "i" } },
      });
    }
    query.push({
      $project: {
        category: 1,
        subCategory: 1,
        image: 1,
      },
    });
    const result = await serviceModel.aggregate(query);
    return res.status(200).json(result);
  } catch (err) {
    return next({ status: 400, err });
  }
};

// UPDATE
export const updateCategory = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    let { cat_id, cat_name, sub_cat_name, new_cat, new_sub_cat } = req.body;
    const imagePath = req.file.path;
    if (!cat_id && !cat_name && !sub_cat_name)
      throw { message: `Category's Name Or Id Is Required` };
    if (!new_cat) throw { message: `New Category Name Is a Required Field` };
    const findCat = cat_id
      ? await serviceModel.findById(cat_id)
      : await serviceModel.findOne({
          category: cat_name,
          subCategory: sub_cat_name,
        });
    if (!findCat) throw { status: 404, message: `Category Not Found` };
    if (findCat.category == new_cat && findCat.subCategory == new_sub_cat)
      throw {
        status: 403,
        message: `This Category With The Same Sub Category Already Exists`,
      };
    const cat = new_cat.toLowerCase();
    const sub_cat = new_sub_cat ? new_sub_cat.toLowerCase() : "";
    const allCats = await serviceModel.find({});
    if (allCats.map((item) => item.category).includes(cat)) {
      if (sub_cat && allCats.map((item) => item.subCategory).includes(sub_cat))
        throw {
          message: `This Category With This Sub Category Already Exists`,
        };
      if (!sub_cat) throw { message: `This Category Already Exists` };
    }
    if (imagePath && findCat.image) {
      fs.unlinkSync(path.join(findCat.image));
    }
    await serviceModel.updateOne(
      { _id: findCat._id },
      {
        $set: {
          category: cat,
          subCategory: sub_cat,
          image: imagePath,
        },
      }
    );
    return res
      .status(200)
      .json({ status: 200, message: `Category Updated`, success: true });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// DELETE
export const deleteCategory = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cat_id } = req.body;
    if (!cat_id) throw { message: `Category Not Found` };
    const findCat = await serviceModel.findById(cat_id);
    if (!findCat) throw { status: 404, message: `Category Not Found` };
    const delCat = await serviceModel.deleteOne({ _id: findCat._id });
    if (!delCat.deletedCount)
      throw { status: 404, message: `Category Not Found` };
    if (findCat.image) {
      fs.unlinkSync(path.join(findCat.image));
    }
    return res
      .status(200)
      .json({ status: 200, message: `Category Deleted`, success: true });
  } catch (err) {
    return next({ status: 400, err });
  }
};
