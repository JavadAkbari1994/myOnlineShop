import { Request } from "express";
import mongoose, { Document, Types } from "mongoose";
import { ErrorCode, MulterError } from "multer";

export interface myErrors extends Error {
  status: number;
  message: string;
  code: ErrorCode;
  err: { errors?: string[]; message: string; status: number };
}

export interface multerErrorInt extends MulterError {
  status?: number;
  message: string;
  code: ErrorCode;
}

export interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

export interface userReqInt extends Request {
  userId?: string;
}

export interface addressInt {
  _id: mongoose.Types.ObjectId;
  title: string;
  city: string;
  mainStreet: string;
  details: string;
}

export enum transactionStatus {
  SUCCESSFUL = "SUCCESSFUL",
  PENDING = "PENDING",
  FAILED = "FAILED",
}

export interface shopTransactionsInt {
  transactionNumber: number;
  shopId: mongoose.Types.ObjectId;
  _id: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  date: Date;
  transactionStat: transactionStatus;
}

export interface userTransactionsInt {
  transactionNumber: number;
  userObjectId: mongoose.Types.ObjectId;
  _id: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  date: Date;
  transactionStat: transactionStatus;
}

export enum orderStatus {
  PENDING = "PENDING",
  CANCELLED = "CANCELLED",
  SUBMITTED = "SUBMITTED",
  DONE = "DONE",
}

export interface ordersInt {
  _id: mongoose.Types.ObjectId;
  userObjectId: mongoose.Types.ObjectId;
  shopObjectId: mongoose.Types.ObjectId;
  shopName: string;
  products: [{ _id: mongoose.Types.ObjectId; quantity: number }];
  totalPrice: number;
  tax: number;
  finalPayment: number;
  date: Date;
  orderStat: orderStatus;
}

export interface operationsInt {
  _id: mongoose.Types.ObjectId;
  adminId: string;
  adminName: string;
  operationInfo: string;
  operationMethod: string;
  date: Date;
}

export enum rolesInt {
  USER = "USER",
  SHOP = "SHOP",
  ADMIN = "ADMIN",
  SUPERADMIN = "SUPERADMIN",
}

export interface userInt extends Document {
  userId: string;
  password: string;
  fName: string;
  lName: string;
  email: string;
  discounts: string;
  refer: string;
  orders: mongoose.Types.ObjectId;
  transactions: shopTransactionsInt[];
  addresses: addressInt[];
  accessToken: string;
  refreshToken: string;
  otp: { value: number; expiresIn: number };
  balance: number;
  role: rolesInt;
  operations?: mongoose.Types.ObjectId;
}

export enum availableCities {
  tehran = "tehran",
  karaj = "karaj",
  isfahan = "isfahan",
  tabriz = "tabriz",
  mashhad = "mashhad",
  rasht = "rasht",
  sari = "sari",
  yazd = "yazd",
  kermanshah = "kermanshah",
  ardabil = "ardabil",
}

export interface serviceInt extends Document {
  category: string;
  subCategory?: string;
  image: string;
}

export interface shopInt extends Document {
  service: serviceInt;
  city: availableCities;
  shopName: string;
  ownerFName: string;
  ownerLName: string;
  nationalId: string;
  userId: string;
  referer: string;
  addresses: addressInt[];
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
  orders: mongoose.Types.ObjectId;
  transactions: shopTransactionsInt[];
  otp: { value: number; expiresIn: number };
  balance: number;
  bankInfo: { cardNumber: string; accountNumber: string; bankName: string };
  products: mongoose.Types.ObjectId[];
  promote?: string[];
  role: rolesInt;
  isActive: boolean;
  image: {
    icon: { url: string; date: Date };
    wallpaper: { url: string; date: Date };
  };
}

export interface updateShopInt {
  shopName?: string;
  ownerFName?: string;
  ownerLName?: string;
  email?: string;
  nationalId?: string;
}

export interface updateAddressInt {
  _id?: mongoose.Types.ObjectId;
  title?: string;
  city?: string;
  mainStreet?: string;
  details?: string;
}

export interface productInt extends Document {
  service: serviceInt;
  shopId: shopInt["_id"];
  title: string;
  price: number;
  details: string;
  score: number;
  image: { url: string; date: Date };
  isAvailable: boolean;
  isConfirmed: boolean;
}

export interface updateProdInt {
  service?: {
    _id: mongoose.Types.ObjectId;
    category: string;
    subCategory: string;
  };
  title?: string;
  price?: number;
  details?: string;
  image?: { url: string; date: number };
  isAvailable?: boolean;
  isConfirmed?: boolean;
}

export interface updateTransInt {
  amount?: number;
  description?: string;
  transactionStat?: transactionStatus;
}
