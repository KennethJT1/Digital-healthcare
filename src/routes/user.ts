import express from "express";
import {
  allDoctors,
  applyForADoctor,
  bookAppointmentWithADoctor,
  bookingAvailability,
  info,
  login,
  register,
  updateProfile,
  userAppointment,
} from "../controllers/userCtrl";
import { AuthSign } from "../middlewares";

const userRouter = express.Router();

userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.get("/info", AuthSign, info);
userRouter.patch("/update-info", AuthSign, updateProfile);
userRouter.post("/create-doctor-profile", AuthSign, applyForADoctor);
userRouter.get("/all-doctors", allDoctors);
userRouter.post(
  "/book-appointmentWith-Doctor",
  AuthSign,
  bookAppointmentWithADoctor
);
userRouter.post("/booking-availability", AuthSign, bookingAvailability);
userRouter.get("/user-appointments", AuthSign, userAppointment);

export default userRouter;
