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
  "/activation",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  activateShop
);
adminShopRouter.post(
  "/transactions",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  createTransaction
);
adminShopRouter.get(
  "/transactions",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getTransactions
);
adminShopRouter.put(
  "/transactions",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateTransaction
);
adminShopRouter.delete(
  "/transactions",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteTransaction
);
adminShopRouter.post(
  "/create",
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
  "/update",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateShop
);
adminShopRouter.delete(
  "/delete",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteShop
);
adminShopRouter.post(
  "/address",
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
  "/address",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateAddress
);
adminShopRouter.delete(
  "/address",
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
  "/balance",
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
  "/bank-info",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateBankInfo
);
adminShopRouter.put(
  "/password",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updatePassword
);
adminShopRouter.post(
  "/icon",
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
  "/icon",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteProfileIcon
);
adminShopRouter.post(
  "/wallpaper",
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
  "/wallpaper",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteProfileWallpaper
);

export { adminShopRouter };
