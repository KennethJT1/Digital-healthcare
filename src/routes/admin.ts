import {
  allDoctors,
  allUsers,
  changeAccountStatus,
} from "../controllers/adminCtrl";

import express from "express";
import { AdminAuthSign } from "../middlewares";

const adminRouter = express.Router();

adminRouter.get("/all-users", AdminAuthSign, allUsers);
adminRouter.get("/all-doctors", AdminAuthSign, allDoctors);
adminRouter.post("/change-status", AdminAuthSign, changeAccountStatus);

export default adminRouter;
