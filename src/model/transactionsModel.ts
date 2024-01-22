import mongoose, { Schema, model } from "mongoose";
import {
  shopTransactionsInt,
  transactionStatus,
  userTransactionsInt,
} from "../module/interfaces";

const transactionsSchema = new Schema<shopTransactionsInt>(
  {
    transactionNumber: {type: Number, required: true},
    shopId: { type: Schema.Types.ObjectId, ref: "shop", required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now() },
    transactionStat: {
      type: String,
      enum: Object.values(transactionStatus),
      required: true,
    },
  },
  { timestamps: true, _id: true }
);

const userTransactionsSchema = new Schema<userTransactionsInt>(
  {
    transactionNumber: {type: Number, required: true},
    userObjectId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now() },
    transactionStat: {
      type: String,
      enum: Object.values(transactionStatus),
      required: true,
    },
  },
  { timestamps: true, _id: true }
);

export const transModel = model<shopTransactionsInt>(
  "shop_transactions",
  transactionsSchema
);

export const userTransModel = model<userTransactionsInt>(
  "user_transactions",
  userTransactionsSchema
);
