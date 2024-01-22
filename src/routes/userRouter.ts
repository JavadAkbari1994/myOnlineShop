import express from "express";
import { checkLogin } from "../middleware/checkLogin";
import { getOrders, newOrder, submitOrder } from "../controller/user/order";
import {
  loginWithOtp,
  loginWithOtpReq,
  loginWithPassword,
  logout,
  signupOrLoginReq,
} from "../controller/user/signupAndLogin";
import {
  changePassword,
  createPassword,
  resetPassword,
} from "../controller/user/password";
import { getName, getProfile, updateProfile } from "../controller/user/profile";
import {
  getReferer,
  getTransactions,
} from "../controller/user/transaction_referer";
import {
  addAddress,
  deleteAddress,
  getAddress,
  updateAddress,
} from "../controller/user/address";
import { getBalance, increaseBalance } from "../controller/user/balance";
import { checkRole } from "../middleware/checkRole";
import { getProducts } from "../controller/user/products";

const userRouter = express.Router();

userRouter.post("/register", signupOrLoginReq);
userRouter.post("/otp-req", loginWithOtpReq);
userRouter.put("/login", loginWithOtp);
userRouter.post("/login", loginWithPassword);
userRouter.post(
  "/password",
  checkLogin,
  checkRole(["SUPERADMIN", "USER"]),
  createPassword
);
userRouter.patch(
  "/password",
  checkLogin,
  checkRole(["SUPERADMIN", "USER"]),
  resetPassword
);
userRouter.put(
  "/password",
  checkLogin,
  checkRole(["SUPERADMIN", "USER"]),
  changePassword
);
userRouter.get("/profile", checkLogin, checkRole(["USER"]), getProfile);
userRouter.post(
  "/profile",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN", "USER"]),
  getName
);
userRouter.put("/profile", checkLogin, checkRole(["USER"]), updateProfile);
userRouter.get("/product", getProducts);
userRouter.post("/orders", checkLogin, checkRole(["USER"]), newOrder);
userRouter.get("/orders", checkLogin, checkRole(["USER"]), getOrders);
userRouter.post("/submit-order", checkLogin, checkRole(["USER"]), submitOrder);
userRouter.post("/add-address", checkLogin, checkRole(["USER"]), addAddress);
userRouter.get("/addresses", checkLogin, checkRole(["USER"]), getAddress);
userRouter.put(
  "/update-address",
  checkLogin,
  checkRole(["USER"]),
  updateAddress
);
userRouter.delete("/del-address", checkLogin, deleteAddress);
userRouter.get(
  "/transactions",
  checkLogin,
  checkRole(["USER"]),
  getTransactions
);
userRouter.get("/referer", checkLogin, checkRole(["USER"]), getReferer);
userRouter.post(
  "/increase-balance",
  checkLogin,
  checkRole(["USER"]),
  increaseBalance
);
userRouter.get("/balance", checkLogin, checkRole(["USER"]), getBalance);
userRouter.post("/logout", checkLogin, checkRole(["USER"]), logout);

export { userRouter };
