import express, { Request, Response, NextFunction } from "express";
import { checkLogin } from "../middleware/checkLogin";
import { checkRole } from "../middleware/checkRole";
import {
  logout,
  shopLoginWithOtp,
  shopLoginWithOtpReq,
  shopLoginWithPassword,
  signUpReq,
} from "../controller/shop/signupAndLogin";
import {
  changePassword,
  createPassword,
  resetPassword,
} from "../controller/shop/password";
import { getProfile } from "../controller/shop/profile";
import { updateProfile } from "../controller/user/profile";
import {
  addAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "../controller/shop/address";
import { getOrders } from "../controller/shop/order";
import {
  getReferer,
  getTransactions,
} from "../controller/shop/transaction_referer";
import {
  getBalance,
  increaseBalance,
  withdrawBalance,
} from "../controller/shop/balance";
import { getBankInfo, updateBankInfo } from "../controller/shop/bankInfo";
import {
  addProduct,
  deleteProduct,
  deleteProductImage,
  getProducts,
  updateProduct,
} from "../controller/shop/product";
import { shopImageUpload } from "../module/multer/shopImageMulter";
import {
  deleteProfileIcon,
  getProfileIcon,
  uploadProfileIcon,
} from "../controller/shop/profileIcon";
import {
  deleteProfileWallpaper,
  getProfileWallpaper,
  uploadProfileWallpaper,
} from "../controller/shop/profileWallpaper";
import { productImageUpload } from "../module/multer/productImageMulter";

const shopRouter = express.Router();

shopRouter.post("/register", signUpReq);
shopRouter.post("/login-with-otp-req", shopLoginWithOtpReq);
shopRouter.post("/login-with-otp", shopLoginWithOtp);
shopRouter.post("/login-with-password", shopLoginWithPassword);
shopRouter.post(
  "/create-password",
  checkLogin,
  checkRole(["SHOP"]),
  createPassword
);
shopRouter.post(
  "/change-password",
  checkLogin,
  checkRole(["SHOP"]),
  changePassword
);
shopRouter.post(
  "/reset-password",
  checkLogin,
  checkRole(["SHOP"]),
  resetPassword
);
shopRouter.get("/profile", checkLogin, checkRole(["SHOP"]), getProfile);
shopRouter.put("/update-profile", checkLogin, checkRole(["SHOP"]), updateProfile);
shopRouter.post(
  "/add-product",
  checkLogin,
  checkRole(["SHOP"]),
  productImageUpload,
  addProduct
);
shopRouter.get("/product", checkLogin, checkRole(["SHOP"]), getProducts);
shopRouter.put(
  "/update-product",
  checkLogin,
  checkRole(["SHOP"]),
  productImageUpload,
  updateProduct
);
shopRouter.delete("/del-product", checkLogin, checkRole(["SHOP"]), deleteProduct);
shopRouter.delete(
  "/product-image",
  checkLogin,
  checkRole(["SHOP"]),
  deleteProductImage
);
shopRouter.post("/add-address", checkLogin, checkRole(["SHOP"]), addAddress);
shopRouter.get("/address", checkLogin, checkRole(["SHOP"]), getAddresses);
shopRouter.put("/update-address", checkLogin, checkRole(["SHOP"]), updateAddress);
shopRouter.delete("/del-address", checkLogin, checkRole(["SHOP"]), deleteAddress);
shopRouter.get("/orders", checkLogin, checkRole(["SHOP"]), getOrders);
shopRouter.get("/referer", checkLogin, checkRole(["SHOP"]), getReferer);
shopRouter.get(
  "/transactions",
  checkLogin,
  checkRole(["SHOP"]),
  getTransactions
);
shopRouter.get("/bank-info", checkLogin, checkRole(["SHOP"]), getBankInfo);
shopRouter.put("/update-bank-info", checkLogin, checkRole(["SHOP"]), updateBankInfo);
shopRouter.get("/balance", checkLogin, checkRole(["SHOP"]), getBalance);
shopRouter.post("/increase-balance", checkLogin, checkRole(["SHOP"]), increaseBalance);
shopRouter.put("/withdraw-balance", checkLogin, checkRole(["SHOP"]), withdrawBalance);
shopRouter.post(
  "/add-icon",
  checkLogin,
  checkRole(["SHOP"]),
  shopImageUpload,
  uploadProfileIcon
);
shopRouter.get("/icon", checkLogin, checkRole(["SHOP"]), getProfileIcon);
shopRouter.delete("/del-icon", checkLogin, checkRole(["SHOP"]), deleteProfileIcon);
shopRouter.post(
  "/add-wallpaper",
  checkLogin,
  checkRole(["SHOP"]),
  shopImageUpload,
  uploadProfileWallpaper
);
shopRouter.get(
  "/wallpaper",
  checkLogin,
  checkRole(["SHOP"]),
  getProfileWallpaper
);
shopRouter.delete(
  "/del-wallpaper",
  checkLogin,
  checkRole(["SHOP"]),
  deleteProfileWallpaper
);
shopRouter.post("/logout", checkLogin, checkRole(["SHOP"]), logout);

export { shopRouter };
