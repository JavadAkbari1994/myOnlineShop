import { Response, NextFunction } from "express";
import { availableCities, userReqInt } from "../../module/interfaces";
import { shopModel } from "../../model/shopModel";
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
    const { title, city, main_street, details } = req.body;
    if (!city) throw { message: `City Is a Required Field` };
    if (!Object.values(availableCities).includes(city.toLowerCase()))
      throw { status: 403, message: `City Is Not Valid` };
    if (!main_street) throw { message: `Main Street Is a Required Field` };
    if (!details) throw { message: `Details Is a Required Field` };
    await shopModel.updateOne(
      { userId },
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
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    let { title, page } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    const findShop = await shopModel.findOne({ userId });
    if (!findShop) throw { status: 404, message: `Shop Not Found` };
    let query: PipelineStage[] = [];
    query.push({ $match: { _id: findShop._id } });
    query.push({ $project: { addresses: findShop.addresses } });
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
    const { _id, title, city, mainStreet, details } = req.body;
    if (!_id) throw { status: 404, message: `Address Not Found` };
    if (!isValidObjectId(_id)) throw { message: `Unable To Find Address` };
    if (!city) throw { message: `City Is a Required Field` };
    if (!Object.values(availableCities).includes(city.toLowerCase()))
      throw { status: 403, message: `City Is Not Valid` };
    if (!mainStreet) throw { message: `Main Street Is a Required Field` };
    if (!details) throw { message: `Details Is a Required Field` };
    const findShop = await shopModel.findOne({ userId });
    const addressIds = findShop.addresses
      .map((item) => item._id)
      .join(",")
      .split(",");
    if (!addressIds.includes(_id))
      throw { status: 404, message: `Address Not Found` };
    await shopModel.findOneAndUpdate(
      { userId },
      { $pull: { addresses: { _id } } }
    );
    await shopModel.findOneAndUpdate(
      { userId },
      {
        $push: {
          addresses: {
            _id,
            title,
            city: city.toLowerCase(),
            mainStreet,
            details,
          },
        },
      }
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
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const { _id } = req.body;
    if (!_id) throw { status: 404, message: `Address Not Found` };
    if (!isValidObjectId(_id)) throw { message: `Unable To Find Address` };
    const shopOwner = await shopModel.findOne({ userId });
    const addressIds = shopOwner.addresses
      .map((item) => item._id)
      .join(",")
      .split(",");
    if (!addressIds.includes(_id))
      throw { status: 404, message: `Address Not Found` };
    await shopModel.findOneAndUpdate(
      { userId },
      { $pull: { addresses: { _id } } }
    );
    return res
      .status(200)
      .json({ status: 200, message: `Address Deleted`, success: true });
  } catch (err) {
    return next({ status: 400, err });
  }
};
