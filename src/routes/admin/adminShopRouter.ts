import express from "express";
import { checkLogin } from "../../middleware/checkLogin";
import { checkRole } from "../../middleware/checkRole";
import { activateShop } from "../../controller/admin/shop/activateShop";
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
} from "../../controller/admin/shop/transactions";
import {
  createShop,
  deleteShop,
  getShop,
  updateShop,
} from "../../controller/admin/shop/shop";
import {
  addAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "../../controller/admin/shop/address";
import { getBalance, updateBalance } from "../../controller/admin/shop/balance";
import {
  getBankInfo,
  updateBankInfo,
} from "../../controller/admin/shop/bankInfo";
import { updatePassword } from "../../controller/admin/shop/password";
import {
  deleteProfileIcon,
  getProfileIcon,
  uploadProfileIcon,
} from "../../controller/admin/shop/uploadProfileIcon";
import {
  deleteProfileWallpaper,
  getProfileWallpaper,
  uploadProfileWallpaper,
} from "../../controller/admin/shop/uploadProfileWallpaper";
import { shopImageUpload } from "../../module/multer/shopImageMulter";

const adminShopRouter = express.Router();

adminShopRouter.put(
  "/shop-activation",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  activateShop
);
adminShopRouter.post(
  "/create-transaction",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  createTransaction
);
adminShopRouter.get(
  "/transaction",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getTransactions
);
adminShopRouter.put(
  "/update-transaction",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateTransaction
);
adminShopRouter.delete(
  "/del-transaction",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteTransaction
);
adminShopRouter.post(
  "/create-shop",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  createShop
);
adminShopRouter.get(
  "/",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getShop
);
adminShopRouter.put(
  "/update-shop",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateShop
);
adminShopRouter.delete(
  "/del-shop",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteShop
);
adminShopRouter.post(
  "/add-address",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  addAddress
);
adminShopRouter.get(
  "/address",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getAddresses
);
adminShopRouter.put(
  "/update-address",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateAddress
);
adminShopRouter.delete(
  "/del-address",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteAddress
);
adminShopRouter.get(
  "/balance",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getBalance
);
adminShopRouter.put(
  "/update-balance",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateBalance
);
adminShopRouter.get(
  "/bank-info",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getBankInfo
);
adminShopRouter.put(
  "/update-bank-info",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateBankInfo
);
adminShopRouter.put(
  "/update-password",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updatePassword
);
adminShopRouter.post(
  "/add-icon",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  shopImageUpload,
  uploadProfileIcon
);
adminShopRouter.get(
  "/icon",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getProfileIcon
);
adminShopRouter.delete(
  "/del-icon",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteProfileIcon
);
adminShopRouter.post(
  "/add-wallpaper",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  shopImageUpload,
  uploadProfileWallpaper
);
adminShopRouter.get(
  "/wallpaper",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getProfileWallpaper
);
adminShopRouter.delete(
  "/del-wallpaper",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteProfileWallpaper
);

export { adminShopRouter };
