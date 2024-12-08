import express from "express";

import { DoctorAuthSign } from "../middlewares";
import {
  acceptAppointment,
  appointDoctor,
  doctorInfo,
  rejectAppointment,
  updateInfo,
  uploadMedicalReport,
} from "../controllers/doctorCtrl";
import upload from "../utils/multer";

const doctorRouter = express.Router();

doctorRouter.get("/doctor_info", DoctorAuthSign, doctorInfo);

doctorRouter.patch("/update_doctor_info", DoctorAuthSign, updateInfo);

doctorRouter.get("/doctor_appointment", DoctorAuthSign, appointDoctor);

doctorRouter.patch("/accept-appointment", DoctorAuthSign, acceptAppointment);
doctorRouter.delete("/reject-appointment", DoctorAuthSign, rejectAppointment);
doctorRouter.post(
  "/upload",
  DoctorAuthSign,
  upload.single("file"),
  uploadMedicalReport
);

export default doctorRouter;
