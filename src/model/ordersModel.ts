import mongoose, { Schema, model } from "mongoose";
import { orderStatus, ordersInt } from "../module/interfaces";

const ordersSchema = new Schema<ordersInt>(
  {
    userObjectId: { type: Schema.Types.ObjectId, ref: "user" },
    shopObjectId: { type: Schema.Types.ObjectId, ref: "shop" },
    shopName: { type: String },
    products: [
      {
        _id: { type: Schema.Types.ObjectId, ref: "product" },
        quantity: { type: Number, default: 1 },
      },
    ],
    totalPrice: { type: Number },
    tax: { type: Number },
    finalPayment: { type: Number },
    date: { type: Date, default: Date.now() },
    orderStat: {
      type: String,
      enum: Object.values(orderStatus),
      default: orderStatus.PENDING,
    },
  },
  { timestamps: true}
);

export const ordersModel = model<ordersInt>("orders", ordersSchema);
