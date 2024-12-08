import express from "express";
import {
  allDoctors,
  applyToBeADoctor,
  bookAppointmentWithADoctor,
  getMedicalHistory,
  info,
  login,
  register,
  updateProfile,
  userAppointment,
  virtualAssistant,
} from "../controllers/userCtrl";
import { AuthSign } from "../middlewares";

const userRouter = express.Router();

userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.get("/info", AuthSign, info);
userRouter.patch("/update-info", AuthSign, updateProfile);
userRouter.post("/create-doctor-profile", AuthSign, applyToBeADoctor);
userRouter.get("/all-doctors", allDoctors);
userRouter.post(
  "/book-appointmentWith-Doctor",
  AuthSign,
  bookAppointmentWithADoctor
);
userRouter.get("/user-appointments", AuthSign, userAppointment);
userRouter.post("/virtual-assistant", virtualAssistant);
userRouter.get("/get-medical-history", AuthSign, getMedicalHistory);

export default userRouter;
