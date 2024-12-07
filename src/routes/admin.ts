import {
  allDoctors,
  allUsers,
  changeAccountStatus,
} from "../controllers/adminCtrl";

import express from "express";
import { AuthSign } from "../middlewares";

const adminRouter = express.Router();

adminRouter.get("/all-users", AuthSign, allUsers);
adminRouter.get("/all-doctors", AuthSign, allDoctors);
adminRouter.post("/change-status", AuthSign, changeAccountStatus);

export default adminRouter;
