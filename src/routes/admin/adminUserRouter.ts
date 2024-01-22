import express from "express";
import { checkLogin } from "../../middleware/checkLogin";
import { checkRole } from "../../middleware/checkRole";
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
} from "../../controller/admin/user/transactions";
import {
  addAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "../../controller/admin/user/address";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../../controller/admin/user/user";
import { getBalance, updateBalance } from "../../controller/admin/user/balance";
import { updatePassword } from "../../controller/admin/user/password";

const adminUserRouter = express.Router();

adminUserRouter.post(
  "/transactions",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  createTransaction
);
adminUserRouter.get(
  "/transactions",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getTransactions
);
adminUserRouter.put(
  "/transactions",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateTransaction
);
adminUserRouter.delete(
  "/transactions",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteTransaction
);
adminUserRouter.post(
  "/create",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  createUser
);
adminUserRouter.get(
  "/",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getUsers
);
adminUserRouter.put(
  "/update",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateUser
);
adminUserRouter.delete(
  "/delete",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteUser
);
adminUserRouter.post(
  "/address",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  addAddress
);
adminUserRouter.get(
  "/address",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getAddresses
);
adminUserRouter.put(
  "/address",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateAddress
);
adminUserRouter.delete(
  "/address",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteAddress
);
adminUserRouter.get(
  "/balance",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getBalance
);
adminUserRouter.put(
  "/balance",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateBalance
);
adminUserRouter.put(
  "/password",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updatePassword
);

export { adminUserRouter };
