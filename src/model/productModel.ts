import mongoose, { Schema, model } from "mongoose";
import { productInt } from "../module/interfaces";

const productSchema = new Schema<productInt>(
  {
    service: {
      _id: { type: Schema.Types.ObjectId, ref: "service", required: true },
      category: { type: String },
      subCategory: { type: String },
    },
    shopId: { type: Schema.Types.ObjectId, ref: "shop", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    details: { type: String, required: true },
    score: { type: Number },
    image: { url: { type: String }, date: { type: Date, default: Date.now() } },
    isAvailable: { type: Boolean, required: true },
    isConfirmed: { type: Boolean, default: false },
  },
  { timestamps: true, _id: true }
);

export const productModel = model<productInt>("product", productSchema);
