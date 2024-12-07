import 'reflect-metadata';
import express, { Application } from "express";
import cors from "cors";
import logger from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from 'express-rate-limit';

import { connectedDB, db } from "./config";
import userRouter from "./routes/user";
import doctorRouter from "./routes/doctor";
import adminRouter from "./routes/admin";


dotenv.config();

db.sync()
  .then(() => {
    console.log("DB connected successfully");
  })
  .catch((err: any) => {
    console.log(err);
  });

// connectedDB();

const app: Application = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger("dev"));
app.use(helmet());
app.use(cors());
app.use(limiter);

app.use("/api/v1/users", userRouter);
app.use("/api/v1/doctors", doctorRouter);
app.use("/api/v1/admin", adminRouter);

export default app;
