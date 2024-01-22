import { Response, NextFunction } from "express";
import { orderStatus, userReqInt } from "../../module/interfaces";
import { productModel } from "../../model/productModel";
import { userModel } from "../../model/userModel";
import { ordersModel } from "../../model/ordersModel";
import { shopModel } from "../../model/shopModel";
import { isValidObjectId } from "mongoose";
import { transModel, userTransModel } from "../../model/transactionsModel";

// CREATE
export const newOrder = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `User Not Found` };
    const { products } = req.body;
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
    const shopObjectId = findShop[0];
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
    const tax = totalPrice * 0.09;
    const finalPayment = totalPrice + tax;
    const findUser = await userModel.findOne({ userId });
    if (!findUser) throw { status: 404, message: `User Not Found` };
    const userObjectId = findUser._id;
    const shop = await shopModel.findById(shopObjectId);
    const order = await ordersModel.create({
      userObjectId,
      shopObjectId,
      shopName: shop.shopName,
      totalPrice,
      tax,
      finalPayment,
      products,
    });
    await userModel.findByIdAndUpdate(userObjectId, {
      $push: { orders: { _id: order._id } },
    });
    await shopModel.findByIdAndUpdate(shopObjectId, {
      $push: { orders: { _id: order._id } },
    });
    return res
      .status(201)
      .json({ status: 201, message: `Order Submitted`, success: true });
  } catch (err) {
    return next({ status: 400, err });
  }
};

// READ
export const getOrders = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    let { filter, id, page } = req.query;
    let pageNumber = +page || 1;
    if (!page) pageNumber = 1;
    const perPage = 10;
    const findUser = await userModel.findOne({ userId });
    if (!findUser) throw { status: 400, message: `User Not Found` };
    if (id) {
      const findOrder = await ordersModel.findById(id);
      return res.status(200).json(findOrder);
    }
    if (filter && !id) {
      const findOrders = await ordersModel.aggregate([
        {
          $match: {
            _id: { $in: findUser.orders },
            orderStat: { $regex: filter, $options: "i" },
          },
        },
        { $skip: (pageNumber - 1) * perPage },
        { $limit: perPage },
      ]);
      return res.status(200).json(findOrders);
    }
    if (!id && !filter) {
      const findOrders = await ordersModel.aggregate([
        { $match: { _id: { $in: findUser.orders } } },
        { $skip: (pageNumber - 1) * perPage },
        { $limit: perPage },
      ]);
      return res.status(200).json(findOrders);
    } else throw { status: 404, message: `Order Not Found` };
  } catch (err) {
    return next({ status: 404, err });
  }
};

// UPDATE
export const submitOrder = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { status: 404, message: `User Not Found` };
    const { orderId, onlinePay, walletPay } = req.body;
    if (!onlinePay && !walletPay)
      throw { message: `Please Choose Your Payment Method` };
    if (onlinePay && typeof onlinePay !== "boolean")
      throw { message: `Your Request Info Is Not Valid` };
    if (walletPay && typeof walletPay !== "boolean")
      throw { message: `Your Request Info Is Not Valid` };
    if (!orderId) throw { status: 404, message: `Order Not Found` };
    if (!isValidObjectId(orderId))
      throw { status: 404, message: `Order Not Found` };
    const findOrder = await ordersModel.findById(orderId);
    if (!findOrder) throw { status: 404, message: `Order Not Found` };
    if (findOrder.orderStat == orderStatus.SUBMITTED)
      throw { message: `You Already Submitted This Order` };
    const payablePrice = findOrder.finalPayment;
    if (walletPay) {
      const findUser = await userModel.findOne({ userId });
      if (findUser.balance < payablePrice)
        throw {
          message: `Your Wallet's Balance Is Lower Than Your Order's Price, Please Increase Your Balance`,
        };
      const userTransaction = await userTransModel.create({
        userObjectId: findUser._id,
        amount: payablePrice,
        description: `Submitting Order With ID: ${orderId}`,
      });
      await userModel.updateOne(
        { userId },
        {
          $inc: { balance: -payablePrice },
          $push: {
            transactions: { _id: userTransaction._id },
            orders: { _id: orderId },
          },
        }
      );
      const shopTransaction = await transModel.create({
        shopId: findOrder.shopObjectId,
        amount: payablePrice,
        description: `Order With ID: ${orderId}`,
      });
      await shopModel.findByIdAndUpdate(findOrder.shopObjectId, {
        $inc: { balance: payablePrice - 0.1 * payablePrice },
        $push: {
          transactions: { _id: shopTransaction._id },
          orders: { _id: orderId },
        },
      });
      findOrder.orderStat = orderStatus.SUBMITTED;
      findOrder.save();
      return res
        .status(200)
        .json({ status: 200, message: `Your Order Submitted`, success: true });
    }
    if (onlinePay) {
      return res.status(200).json({
        status: 200,
        message: `Direct To Online Payment Gateway`,
        success: true,
      });
    }
    return res.status(400).json({
      status: 400,
      message: `Your Info Is Not Valid, Try Reloading The Page`,
      success: false,
    });
  } catch (err) {
    return next({ status: 400, err });
  }
};
