import express from "express";
import { adminShopRouter } from "./adminShopRouter";
import { adminUserRouter } from "./adminUserRouter";
import { checkLogin } from "../../middleware/checkLogin";
import { checkRole } from "../../middleware/checkRole";
import { changeRole } from "../../controller/admin/superAdmin/changeRole";
import { getAdmins } from "../../controller/admin/superAdmin/getAdmins";
import {
  addProduct,
  deleteProduct,
  deleteProductImage,
  getProducts,
  updateProduct,
} from "../../controller/admin/product";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "../../controller/admin/category";
import { getOperations } from "../../controller/admin/superAdmin/operation";
import {
  createOrder,
  deleteOrder,
  getOrder,
  updateOrder,
} from "../../controller/admin/order";
import { categoryImageUpload } from "../../module/multer/categoryImageMulter";
import { productImageUpload } from "../../module/multer/productImageMulter";
import { updatePassword } from "../../controller/admin/superAdmin/password";

const adminRouter = express.Router();

adminRouter.use("/shop", adminShopRouter);
adminRouter.use("/user", adminUserRouter);
adminRouter.get("/", checkLogin, checkRole(["SUPERADMIN"]), getAdmins);
adminRouter.get(
  "/operations",
  checkLogin,
  checkRole(["SUPERADMIN"]),
  getOperations
);
adminRouter.patch("/role", checkLogin, checkRole(["SUPERADMIN"]), changeRole);
adminRouter.put(
  "/password",
  checkLogin,
  checkRole(["SUPERADMIN"]),
  updatePassword
);
adminRouter.post(
  "/product",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  productImageUpload,
  addProduct
);
adminRouter.get(
  "/product",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getProducts
);
adminRouter.put(
  "/product",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  productImageUpload,
  updateProduct
);
adminRouter.delete(
  "/product",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteProduct
);
adminRouter.delete(
  "/product-image",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteProductImage
);
adminRouter.post(
  "/category",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  categoryImageUpload,
  createCategory
);
adminRouter.put(
  "/category",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  categoryImageUpload,
  updateCategory
);
adminRouter.delete(
  "/category",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteCategory
);
adminRouter.post(
  "/orders",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  createOrder
);
adminRouter.get(
  "/orders",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  getOrder
);
adminRouter.put(
  "/orders",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  updateOrder
);
adminRouter.delete(
  "/orders",
  checkLogin,
  checkRole(["SUPERADMIN", "ADMIN"]),
  deleteOrder
);

export { adminRouter };
