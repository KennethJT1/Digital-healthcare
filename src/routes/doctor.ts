import express from "express";

import { AuthSign } from "../middlewares";
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

doctorRouter.get("/doctor_info", AuthSign, doctorInfo);

doctorRouter.patch("/update_doctor_info", AuthSign, updateInfo);

doctorRouter.get("/doctor_appointment", AuthSign, appointDoctor);

doctorRouter.patch("/accept-appointment", AuthSign, acceptAppointment);
doctorRouter.delete("/reject-appointment", AuthSign, rejectAppointment);
doctorRouter.post(
  "/upload",
  AuthSign,
  upload.array("file", 3),
  uploadMedicalReport
);

export default doctorRouter;
