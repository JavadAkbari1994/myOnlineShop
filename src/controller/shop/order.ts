import { Response, NextFunction } from "express";
import { orderStatus, userReqInt } from "../../module/interfaces";
import { shopModel } from "../../model/shopModel";
import { ordersModel } from "../../model/ordersModel";

// READ
export const getOrders = async (
  req: userReqInt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    if (!userId) throw { message: `Something Went Wrong, Please Try Again` };
    const orders = await shopModel.findOne({ userId }, { orders: 1 });
    if (!orders) throw { status: 400, message: `Orders Not Found` };
    const orderFind = await ordersModel.find({ _id: { $in: orders.orders } });
    const { order_status } = req.query;
    if (order_status == orderStatus.SUBMITTED) {
      const filteredOrder = orderFind.filter(
        (item) => item.orderStat == orderStatus.SUBMITTED
      );
      return res.status(200).json(filteredOrder);
    }
    if (order_status == orderStatus.CANCELLED) {
      const filteredOrder = orderFind.filter(
        (item) => item.orderStat == orderStatus.CANCELLED
      );
      return res.status(200).json(filteredOrder);
    }
    if (order_status == orderStatus.PENDING) {
      const filteredOrder = orderFind.filter(
        (item) => item.orderStat == orderStatus.PENDING
      );
      return res.status(200).json(filteredOrder);
    }
    if (order_status == orderStatus.DONE) {
      const filteredOrder = orderFind.filter(
        (item) => item.orderStat == orderStatus.DONE
      );
      return res.status(200).json(filteredOrder);
    } else return res.status(200).json(orderFind);
  } catch (err) {
    return next({ status: 404, err });
  }
};