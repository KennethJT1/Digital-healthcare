import { Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import Doctor from "../models/doctorModel";
import Appointment from "../models/doctorAppointmentModel";
import { medicalHistorySchema, updateDoctorSchema } from "../utils/validation";
import User from "../models/userModel";
import upload from "../utils/multer";
import { MedicalRecord } from "../models/MedicalRecordModel";

export const doctorInfo = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const doctor = await Doctor.findOne({ where: { userId: req.user } });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor info fetched successfully",
      data: doctor,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: `Error fetching doctor info: ${error.message}`,
    });
  }
};

export const updateInfo = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { error, value } = updateDoctorSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      errors: error.details.map((err: any) => err.message),
    });
  }

  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      website,
      address,
      specialization,
      experience,
      feesPerConsultation,
      status,
      timings,
    } = value;

    const doctor = await Doctor.findOne({ where: { userId: req.user } });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (email && email !== doctor.email) {
      const existingDoctor = await Doctor.findOne({ where: { email } });
      if (existingDoctor) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    doctor.firstName = firstName || doctor.firstName;
    doctor.lastName = lastName || doctor.lastName;
    doctor.phone = phone || doctor.phone;
    doctor.email = email || doctor.email;
    doctor.website = website || doctor.website;
    doctor.address = address || doctor.address;
    doctor.specialization = specialization || doctor.specialization;
    doctor.experience = experience || doctor.experience;
    doctor.feesPerConsultation =
      feesPerConsultation || doctor.feesPerConsultation;
    doctor.status = status || doctor.status;
    doctor.timings = timings || doctor.timings;

    await doctor.save();

    return res.status(200).json({
      success: true,
      message: "Doctor info updated successfully",
      data: doctor,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Error updating doctor info: ${err.message}`,
    });
  }
};

export const appointDoctor = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const doctor = await Doctor.findOne({ where: { userId: req.user } });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const appointments = await Appointment.findAll({
      where: { doctorId: doctor.id },
    });

    return res.status(200).json({
      success: true,
      message: "Doctor appointments fetched successfully",
      counts: appointments.length,
      data: appointments,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: `Error fetching doctor appointments: ${error.message}`,
    });
  }
};

export const acceptAppointment = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { appointmentId } = req.body;

  try {
    const appointment = await Appointment.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
        success: false,
      });
    }
    if (appointment.doctorId !== req.user) {
      return res.status(403).json({
        message: "You are not authorized to accept this appointment",
        success: false,
      });
    }

    appointment.status = "accepted";
    await appointment.save();

    const user = await User.findOne({ where: { id: appointment.userId } });
    if (user) {
      const message = `Your appointment request with Dr. ${appointment.doctorInfo.firstName} has been accepted.`;
      user.notification.push({
        type: "Appointment-accepted",
        message,
        onClickPath: "/user/appointments",
      });
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Appointment accepted successfully",
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: `Error accepting appointment: ${error.message}`,
    });
  }
};

export const rejectAppointment = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { appointmentId } = req.body;

  try {
    const appointment = await Appointment.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
        success: false,
      });
    }

    if (appointment.doctorId !== req.user) {
      return res.status(403).json({
        message: "You are not authorized to reject this appointment",
        success: false,
      });
    }

    appointment.status = "rejected";
    await appointment.save();

    const user = await User.findOne({ where: { id: appointment.userId } });
    if (user) {
      const message = `Your appointment request with Dr. ${appointment.doctorInfo.firstName} has been rejected.`;
      user.notification.push({
        type: "Appointment-rejected",
        message,
        onClickPath: "/user/appointments",
      });
      await user.save();
    }

    await appointment.destroy();

    return res.status(200).json({
      success: true,
      message: "Appointment rejected and deleted successfully",
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: `Error rejecting appointment: ${error.message}`,
    });
  }
};

export const uploadMedicalReport = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { error, value } = medicalHistorySchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const formattedErrors = error.details.map((err: any) => ({
      field: err.context.key,
      message: err.message,
    }));
    return res.status(400).json({ errors: formattedErrors });
  }

  try {
    const doctorId = req.user;
    const fileUrl = req.file?.path;

    if (!fileUrl) {
      return res.status(400).json({ message: "File upload failed" });
    }

    const { appointmentId } = req.body;

    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        doctorId,
      },
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Appointment not found for this doctor" });
    }

    const patientId = appointment.userId;

    let medicalRecord = await MedicalRecord.findOne({ doctorId, patientId });

    if (!medicalRecord) {
      medicalRecord = new MedicalRecord({
        doctorId,
        patientId,
        records: [fileUrl],
        date: new Date(),
      });
      await medicalRecord.save();
    } else {
      medicalRecord.records.push(fileUrl);
      await medicalRecord.save();
    }

    const patient = await User.findOne({ where: { id: patientId } });

    if (patient) {
      const notificationMessage = {
        type: "Doctor's report",
        message: `You have a new medical report uploaded by Dr. ${appointment
          ?.doctorInfo?.firstName!}`,
        onClickPath: `/medical-reports/${appointment?.userInfo?.name!}`,
      };

      patient.notification = [
        ...(patient.notification || []),
        notificationMessage,
      ];
      await patient.save();
    }

    res.status(200).json({
      success: true,
      message: "Report uploaded successfully",
      medicalRecord,
    });

    res.status(200).json({
      success: true,
      message: "Report uploaded successfully",
      medicalRecord,
    });
  } catch (error) {
    console.error("Error uploading medical report:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to upload report" });
  }
};
