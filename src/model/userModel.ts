import mongoose, { Schema, model } from "mongoose";
import {
  addressInt,
  availableCities,
  rolesInt,
  userInt,
} from "../module/interfaces";

const addressSchema = new Schema<addressInt>(
  {
    title: { type: String },
    city: {
      type: String,
      enum: Object.values(availableCities),
      required: true,
    },
    mainStreet: { type: String, required: true },
    details: { type: String, required: true },
  },
  { timestamps: true ,_id: true }
);

const userSchema = new Schema<userInt>(
  {
    userId: { type: String },
    password: { type: String },
    fName: { type: String },
    lName: { type: String },
    email: { type: String },
    orders: [{ type: Schema.Types.ObjectId, ref: "orders" }],
    refer: { type: String },
    transactions: [{ type: Schema.Types.ObjectId, ref: "user_transactions" }],
    addresses: [addressSchema],
    accessToken: { type: String, default: "" },
    refreshToken: { type: String, default: "" },
    otp: { value: { type: Number }, expiresIn: { type: Number } },
    balance: { type: Number, default: 0 },
    role: {
      type: String,
      enum: Object.values(rolesInt),
      default: rolesInt.USER,
    },
    operations: [{ type: Schema.Types.ObjectId, ref: "operation" }],
  },
  { timestamps: true, _id: true }
);

const userModel = model<userInt>("user", userSchema);

export { userModel };
