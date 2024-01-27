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
  "/create-transaction",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  createTransaction
);
adminUserRouter.get(
  "/transaction",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getTransactions
);
adminUserRouter.put(
  "/update-transaction",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateTransaction
);
adminUserRouter.delete(
  "/del-transaction",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteTransaction
);
adminUserRouter.post(
  "/create-user",
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
  "/update-user",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateUser
);
adminUserRouter.delete(
  "/del-user",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteUser
);
adminUserRouter.post(
  "/add-address",
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
  "/update-address",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateAddress
);
adminUserRouter.delete(
  "/del-address",
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
  "/update-balance",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateBalance
);
adminUserRouter.put(
  "/update-password",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updatePassword
);

export { adminUserRouter };
