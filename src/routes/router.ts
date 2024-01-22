import express, { Express, NextFunction, Request, Response } from "express";
import { userRouter } from "./userRouter";
import { shopRouter } from "./shopRouter";
import { refreshTokenController } from "../controller/refreshTokenController";
import { adminRouter } from "./admin/adminRouter";
import { searchRouter } from "./searchRouter";
import { getCategory } from "../controller/admin/category";

const mainRouter = express.Router();

mainRouter.get("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ status: 200, message: `Server Is Running` });
  } catch (error) {
    next({ status: 400, error });
  }
});
mainRouter.post("/auth/refresh-token", refreshTokenController);
mainRouter.get("/category", getCategory);
mainRouter.use("/admin", adminRouter);
mainRouter.use("/user", userRouter);
mainRouter.use("/shop", shopRouter);
mainRouter.use("/search", searchRouter);

export { mainRouter };
