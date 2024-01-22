import { Request, Response, NextFunction } from "express";
import { myErrors } from "../module/interfaces";
import { MulterError } from "multer";

const notFoundError = (req: Request, res: Response, next: NextFunction) => {
  return res
    .status(404)
    .json({ status: 404, message: `Sorry, Page Not Found`, success: false });
};

const errorHandler = (
  error: myErrors,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let message =
    error.err?.errors ||
    error.err?.message ||
    error.message ||
    `Internal Server Error`;
  let status = error.err?.status || error.status || 500;
  if (error.code === `LIMIT_FILE_SIZE`) {
    status = 403;
    message = `Your File's Size Should Be Less Than 200 KB`;
  }
  if (error.code === `LIMIT_UNEXPECTED_FILE`) {
    status = 403;
    message = `You Should Upload Just One File`;
  }
  return res.status(status).json({ status, message, success: false });
};

export { notFoundError, errorHandler };
