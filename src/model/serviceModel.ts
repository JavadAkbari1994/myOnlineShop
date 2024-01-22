import mongoose, { Schema, model } from "mongoose";
import { serviceInt } from "../module/interfaces";

const serviceSchema: Schema = new Schema({
  category: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
    required: (x: string) => x == "restaurant",
  },
  image: { type: String },
});

export const serviceModel = model<serviceInt>("service", serviceSchema);
