import multer, { MulterError } from "multer";
import fs from "fs";
import path from "path";
import { RequestHandler } from "express";
import { multerErrorInt } from "../interfaces";

const createStorageDirectory = (directory: string): void => {
  try {
    fs.mkdirSync(directory, { recursive: true });
  } catch (err) {
    throw new Error("Failed To Create Directory");
  }
};

const generateFilename = (file: Express.Multer.File): string => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${uniqueSuffix}.${file.mimetype.split("/")[1]}`;
};

const storage = multer.diskStorage({
  destination: function (
    req,
    file,
    cb: (error: Error | null, path: string) => void
  ) {
    const acceptedFormats = ["png", "jpg", "jpeg"];
    if (!acceptedFormats.includes(file.mimetype.split("/")[1])) {
      const error: multerErrorInt = new Error as multerErrorInt;
      error.message = `Only Files With '.png', '.jpg' And '.jpeg' Are Acceptable`;
      error.code = "LIMIT_UNACCEPTABLE_TYPE" as MulterError["code"];
      error.status = 403;
      return cb(error, "");
    }
    const directory = path.join(__dirname, "..", "..", "public", "category");
    createStorageDirectory(directory);
    cb(null, directory);
  },
  filename: function (req, file, cb) {
    cb(null, generateFilename(file));
  },
});

const maxSize = 200 * 1024;
export const categoryImageUpload: RequestHandler = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single("img");