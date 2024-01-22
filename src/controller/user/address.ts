import { Response, NextFunction } from "express";
import { availableCities, userReqInt } from "../../module/interfaces";
import { userModel } from "../../model/userModel";
import { isValidObjectId } from "mongoose";

// CREATE
export const addAddress = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const { title, city, mainStreet, details } = req.body;
    if (!city) throw { message: `City Is a Required Field` };
    if (!Object.values(availableCities).includes(city.toLowerCase()))
      throw { status: 403, message: `City Is Not Valid` };
    if (!mainStreet) throw { message: `Main Street Is a Required Field` };
    if (!details) throw { message: `Details Is a Required Field` };
    await userModel.updateOne(
      { userId },
      {
        $push: {
          addresses: { title, city: city.toLowerCase(), mainStreet, details },
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
export const getAddress = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    let { title, id, page } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    const findUser = await userModel.findOne({ userId });
    if (!findUser) throw { status: 404, message: `User Not Found` };
    if (id) {
      const findAddress = await userModel.findById(id);
      return res.status(200).json(findAddress);
    }
    if (title && title.length !== 0) {
      const titles = Array.isArray(title) ? title : [title];
      const fixCaseSens = titles.map((item) => String(item).toLowerCase());
      const findAddress = await userModel.aggregate([
        { $match: { _id: findUser._id } },
        { $unwind: "$addresses" },
        { $match: { "addresses.title": { $in: fixCaseSens } } },
        { $sort: { "addresses.createdAt": 1 } },
        { $group: { _id: null, addresses: { $push: "$addresses" } } },
        { $project: { addresses: 1, _id: 0 } },
        { $skip: (pageNumber - 1) * perPage },
        { $limit: perPage },
      ]);
      if (findAddress.length === 0) {
        pageNumber = 1;
        const fixFindAddress = await userModel.aggregate([
          { $match: { _id: findUser._id } },
          { $unwind: "$addresses" },
          { $match: { "addresses.title": { $in: fixCaseSens } } },
          { $sort: { "addresses.createdAt": 1 } },
          { $group: { _id: null, addresses: { $push: "$addresses" } } },
          { $project: { addresses: 1, _id: 0 } },
          { $skip: (pageNumber - 1) * perPage },
          { $limit: perPage },
        ]);
        return res.status(200).json(fixFindAddress);
      }
      return res.status(200).json(findAddress);
    }
    if (!id && !title) {
      const findAddress = await userModel.aggregate([
        { $match: { _id: findUser._id } },
        { $unwind: "$addresses" },
        { $sort: { "addresses.createdAt": 1 } },
        { $group: { _id: null, addresses: { $push: "$addresses" } } },
        { $project: { addresses: 1, _id: 0 } },
        { $skip: (pageNumber - 1) * perPage },
        { $limit: perPage },
      ]);
      return res.status(200).json(findAddress);
    } else throw { status: 404, message: `Order Not Found` };
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
    const user = await userModel.findOne({ userId });
    const addressIds = user.addresses
      .map((item) => item._id)
      .join(",")
      .split(",");
    if (!addressIds.includes(_id))
      throw { status: 404, message: `Address Not Found` };
    await userModel.findOneAndUpdate(
      { userId },
      { $pull: { addresses: { _id } } }
    );
    await userModel.findOneAndUpdate(
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
    const user = await userModel.findOne({ userId });
    const addressIds = user.addresses
      .map((item) => item._id)
      .join(",")
      .split(",");
    if (!addressIds.includes(_id))
      throw { status: 404, message: `Address Not Found` };
    await userModel.findOneAndUpdate(
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
