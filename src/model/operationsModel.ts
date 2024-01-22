import mongoose, { Schema, model } from "mongoose";
import { operationsInt } from "../module/interfaces";

const operationSchema = new Schema<operationsInt>(
  {
    adminId: { type: String, required: true },
    adminName: { type: String, required: true },
    operationInfo: { type: String, required: true },
    operationMethod: {type: String, required: true},
    date: { type: Date, default: Date.now() },
  },
  { timestamps: true, _id: true }
);

export const operationsModel = model<operationsInt>(
  "operation",
  operationSchema
);
