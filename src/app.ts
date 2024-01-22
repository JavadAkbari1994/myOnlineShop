import express, { Express, NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { mainRouter } from "./routes/router";
import mongoose from "mongoose";
import { Client } from "pg";
import { errorHandler, notFoundError } from "./middleware/error";
import { firstCheckLogin } from "./middleware/firstCheckLogin";

// Connect To Postgres
// const client = new Client({
//   user: "postgres",
//   host: "127.0.0.1",
//   database: "postgres",
//   password: "javadzx9231994",
//   port: 5432,
// });
// client
//   .connect()
//   .then(() => console.log("Connected To Postgres"))
//   .catch((e) => console.log(e));

mongoose
  .connect("mongodb://127.0.0.1:27017/snappFoodProject")
  .then(() => console.log("Connected To MongoDB"))
  .catch((e) => console.log(e));

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", firstCheckLogin, mainRouter);
app.use(notFoundError);
app.use(errorHandler);

app.listen(3000, () => console.log("Server Is Running On Port 3000"));
