import { NextFunction, Response } from "express";
import { orderStatus, userReqInt } from "../../module/interfaces";
import { ordersModel } from "../../model/ordersModel";
import { PipelineStage, isValidObjectId } from "mongoose";
import { shopModel } from "../../model/shopModel";
import { userModel } from "../../model/userModel";
import { productModel } from "../../model/productModel";
import { operationsModel } from "../../model/operationsModel";

// CREATE
export const createOrder = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `Admin Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `Admin Not Found` };
    const { user_number, products } = req.body;
    if (!products) throw { status: 404, message: `Product Not Found` };
    const productIds = products.map((item: any) => item._id);
    const findProduct = await productModel.find({ _id: { $in: productIds } });
    if (!findProduct) throw { status: 404, message: `Product Not Found` };
    const findShop = findProduct
      .map((item) => item.shopId)
      .join(",")
      .split(",");
    const validateOrder = findShop.map((item) => item === findShop[0]);
    if (validateOrder.includes(false))
      throw {
        status: 403,
        message: `You Cant Use Products Of Different Shops In One Order`,
      };
    let totalPrice = 0;
    findProduct.forEach((product: any) => {
      const orderProduct = products.find(
        (item: any) => item._id === String(product._id)
      );
      if (!orderProduct)
        throw { message: `Something Went Wrong, Please Try Again` };
      const sum = product.price * orderProduct.quantity;
      totalPrice += sum;
    });
    console.log(findShop[0]);
    const shopObjectId = findShop[0]
    const tax = totalPrice * 0.09;
    const finalPayment = totalPrice + tax;
    const findUser = await userModel.findOne({ userId: user_number });
    if (!findUser) throw { status: 404, message: `User Not Found` };
    const shop = await shopModel.findById(shopObjectId);
    const order = await ordersModel.create({
      userObjectId: findUser._id,
      shopObjectId: shop._id,
      shopName: shop.shopName,
      totalPrice,
      tax,
      finalPayment,
      products: products,
    });
    await userModel.findByIdAndUpdate(findUser._id, {
      $push: { orders: { _id: order._id } },
    });
    await shopModel.findByIdAndUpdate(shop._id, {
      $push: { orders: { _id: order._id } },
    });
    // const newOperation = await operationsModel.create({
    //   adminId: userId,
    //   adminName: `${findAdmin.fName} ${findAdmin.lName}`,
    //   operationInfo: `Add Products With Ids: ${product_ids} From Shop: ${findShop[0]} For User With User Id: ${findUser.userId}`,
    //   operationMethod: "ADDORDER",
    // });
    // await userModel.updateOne(
    //   { userId },
    //   { $push: { operations: newOperation._id } }
    // );
    return res
      .status(201)
      .json({ status: 201, message: `Order Created`, success: true });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// READ
export const getOrder = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    let { id, order_status, shop_id, user_id, min_price, max_price, page } =
      req.body;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    if (id) {
      if (!isValidObjectId(id))
        throw { status: 404, message: `Order Not Found` };
      const findOrder = await ordersModel.findById(id);
      if (!findOrder) throw { status: 404, message: `Order Not Found` };
      return res.status(200).json(findOrder);
    }
    let query: PipelineStage[] = [];
    if (shop_id && isValidObjectId(shop_id)) {
      const findShop = await shopModel.findById(shop_id);
      if (findShop) {
        query.push({ $match: { shopObjectId: findShop._id } });
      }
    }
    if (user_id && isValidObjectId(user_id)) {
      const findUser = await userModel.findById(user_id);
      if (findUser) {
        query.push({ $match: { userObjectId: findUser._id } });
      }
    }
    if (min_price) {
      query.push({ $match: { finalPayment: { $gte: +min_price } } });
    }
    if (max_price) {
      query.push({ $match: { finalPayment: { $lte: +max_price } } });
    }
    if (order_status && order_status.length !== 0) {
      const statuses = Array.isArray(order_status)
        ? order_status
        : [order_status];
      const fixCaseSens = statuses.map((item) => String(item).toUpperCase());
      query.push({ $match: { orderStat: { $in: fixCaseSens } } });
    }
    query.push({ $sort: { date: -1 } });
    const findOrder = await ordersModel.aggregate(query);
    const maxPages = Math.ceil(findOrder.length / perPage);
    if (pageNumber > maxPages) pageNumber = 1;
    query.push({ $skip: (pageNumber - 1) * perPage });
    query.push({ $limit: perPage });
    const result = await ordersModel.aggregate(query);
    if (findOrder.length > 0) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json({
        status: 404,
        message: `No Order With Your Description Was Found`,
      });
    }
  } catch (err) {
    return next({ status: 400, err });
  }
};

// UPDATE
export const updateOrder = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { order_id, status } = req.body;
    if (!order_id || !isValidObjectId(order_id))
      throw { status: 404, message: `Order Not Found` };
    if (
      !orderStatus ||
      !Object.values(orderStatus).includes(status.toUpperCase())
    )
      throw { message: `Invalid Status Input` };
    const findOrder = await ordersModel.findById(order_id);
    if (!findOrder) throw { status: 404, message: `Order Not Found` };
    const { userId } = req;
    if (!userId) throw { status: 404, message: `User Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    await ordersModel.findByIdAndUpdate(order_id, {
      $set: { orderStat: status.toUpperCase() },
    });
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Updating Order Status With Id: ${order_id} From ${
        findOrder.orderStat
      } To ${status.toUpperCase()} `,
      operationMethod: "UPDATEORDER",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(200).json({
      status: 200,
      message: `Order Updated Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// DELETE
export const deleteOrder = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { order_id } = req.body;
    if (!order_id || !isValidObjectId(order_id))
      throw { status: 404, message: `Order Not Found` };
    const findOrder = await ordersModel.findById(order_id);
    if (!findOrder) throw { status: 404, message: `Order Not Found` };
    const { userId } = req;
    if (!userId) throw { status: 404, message: `User Not Found` };
    const findAdmin = await userModel.findOne({ userId });
    if (!findAdmin) throw { status: 404, message: `User Not Found` };
    await ordersModel.findByIdAndDelete(order_id);
    await userModel.findByIdAndUpdate(findOrder.userObjectId, {
      $pull: { orders: findOrder._id },
    });
    await shopModel.findByIdAndUpdate(findOrder.shopObjectId, {
      $pull: { orders: findOrder._id },
    });
    const newOperation = await operationsModel.create({
      adminId: userId,
      adminName: `${findAdmin.fName} ${findAdmin.lName}`,
      operationInfo: `Delete Order With Id: ${order_id}, User Id: ${findOrder.userObjectId} And Shop Id: ${findOrder.shopObjectId}`,
      operationMethod: "DELETEORDER",
    });
    await userModel.updateOne(
      { userId },
      { $push: { operations: newOperation._id } }
    );
    return res.status(200).json({
      status: 200,
      message: `Order Deleted Successfully`,
      success: true,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};
