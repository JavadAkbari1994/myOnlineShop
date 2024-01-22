import mongoose, { Schema, model } from "mongoose";
import {
  addressInt,
  availableCities,
  rolesInt,
  shopInt,
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
  { _id: true }
);

const shopSchema = new Schema<shopInt>(
  {
    service: {
      _id: { type: Schema.Types.ObjectId, ref: "service", required: true },
      category: { type: String, required: true },
      subCategory: { type: String },
    },
    city: {
      type: String,
      enum: Object.values(availableCities),
      required: true,
    },
    ownerFName: { type: String, required: true },
    ownerLName: { type: String, required: true },
    nationalId: { type: String },
    shopName: { type: String, required: true },
    userId: { type: String, required: true },
    referer: { type: String },
    addresses: [addressSchema],
    email: { type: String },
    password: { type: String },
    accessToken: { type: String, default: "" },
    refreshToken: { type: String, default: "" },
    orders: [{ type: Schema.Types.ObjectId, ref: "orders" }],
    transactions: [{ type: Schema.Types.ObjectId, ref: "shop_transactions" }],
    otp: { value: { type: Number }, expiresIn: { type: Number } },
    balance: { type: Number, default: 0 },
    bankInfo: {
      cardNumber: { type: String },
      accountNumber: { type: String },
      bankName: { type: String },
    },
    image: {
      icon: {
        url: { type: String },
        date: { type: Date, default: Date.now() },
      },
      wallpaper: {
        url: { type: String },
        date: { type: Date, default: Date.now() },
      },
    },
    products: [{ type: Schema.Types.ObjectId, ref: "product" }],
    promote: { type: [String] },
    role: {
      type: String,
      enum: Object.values(rolesInt),
      default: rolesInt.SHOP,
    },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true, _id: true }
);

export const shopModel = model<shopInt>("shop", shopSchema);
