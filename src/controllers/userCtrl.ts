import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import moment from "moment";
import { Op } from "sequelize";

import {
  appointmentSchema,
  doctorValidationSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "../utils/validation";
import User from "../models/userModel";
import { EXPIRESIN, JWT_SECRET, SALT_ROUNDS } from "../config";
import Doctor from "../models/doctorModel";
import Appointment from "../models/doctorAppointmentModel";

export const register = async (req: Request, res: Response): Promise<any> => {
  const { error, value } = registerSchema.validate(req.body, {
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
    const { name, email, password, address, medicalHistory } = value;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      address,
      medicalHistory,
    });
    user!.password = undefined as any;

    return res
      .status(201)
      .json({ message: "User registered successfully", user });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  const { error, value } = loginSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const formattedErrors = error.details.map((err: any) => ({
      field: err.context.key,
      message: err.context.value,
    }));
    return res.status(400).json({ errors: formattedErrors });
  }

  try {
    const { email, password } = value;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: EXPIRESIN,
    });

    return res.status(200).json({ message: "Login successful", token });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

export const info = async (req: JwtPayload, res: Response): Promise<any> => {
  try {
    const user = await User.findOne({ where: { id: req.user } });
    user!.password = undefined as any;

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    } else {
      res.status(200).json({
        success: true,
        data: user,
      });
    }
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

export const updateProfile = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { error, value } = updateProfileSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res
      .status(400)
      .json({ errors: error.details.map((err) => err.message) });
  }

  try {
    const { name, email, password, address, medicalHistory } = value;

    const user = await User.findOne({ where: { id: req.user } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    if (password) {
      user.password = await bcrypt.hash(password, SALT_ROUNDS); // Hash new password if provided
    }
    user.address = address || user.address;
    user.medicalHistory = medicalHistory || user.medicalHistory;

    await user.save();
    user!.password = undefined as any;

    return res
      .status(200)
      .json({ message: "Profile updated successfully", user });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

export const applyForADoctor = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { error, value } = doctorValidationSchema.validate(req.body, {
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
    const user = await User.findOne({ where: { id: req.user } });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

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
      timings,
    } = value;

    const doctor = await Doctor.create({
      id: uuidv4(),
      userId: user.id,
      firstName,
      lastName,
      phone,
      email,
      website,
      address,
      specialization,
      experience,
      feesPerConsultation,
      timings,
    });

    return res
      .status(201)
      .json({ message: "Doctor account successfully created", doctor });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

export const allDoctors = async (req: Request, res: Response) => {
  try {
    const doctors = await Doctor.findAll({
      where: { status: "approved" },
      attributes: [
        "firstName",
        "website",
        "address",
        "specialization",
        "experience",
        "feesPerConsultation",
        "timings",
      ],
    });
    res.status(200).send({
      success: true,
      message: "Doctors Lists Fetched Successfully",
      counts: doctors.length,
      data: doctors,
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `AllDoctor User_Controller ${error.message}`,
    });
  }
};

export const bookAppointmentWithADoctor = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { error, value } = appointmentSchema.validate(req.body, {
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
    const userInfo = await User.findOne({ where: { id: req.user } });
    if (!userInfo) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    const { doctorId, testType, date, time } = value;

    const doctorInfo = await Doctor.findOne({ where: { id: doctorId } });
    if (!doctorInfo) {
      return res.status(404).json({
        message: "Doctor not found",
        success: false,
      });
    }

    const newAppointment = await Appointment.create({
      id: uuidv4(),
      userId: userInfo.id,
      doctorId,
      userInfo: {
        name: userInfo.name,
        medicalHistory: userInfo.medicalHistory,
      },
      doctorInfo: {
        firstName: doctorInfo.firstName,
        website: doctorInfo.website,
        address: doctorInfo.address,
        specialization: doctorInfo.specialization,
        experience: doctorInfo.experience,
        feesPerConsultation: doctorInfo.feesPerConsultation,
        timings: doctorInfo.timings,
      },
      testType,
      date,
      time,
    });

    const user = await User.findOne({
      where: { id: doctorInfo.userId },
    });

    if (user) {
      const message = `A new Appointment Request from ${userInfo.name} with this medical history: ${userInfo.medicalHistory}`;
      const truncatedMessage =
        message.length > 255 ? message.slice(0, 255) : message;

      user.notification.push({
        type: "Appointment-request",
        message: truncatedMessage,
        onClickPath: "/user/book-appointmentWith-Doctor",
      });

      await user.save();
    }

    res.status(200).send({
      success: true,
      message: "Appointment Booked successfully",
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `BookAppointmentWithADoctor User_Controller ${error.message}`,
    });
  }
};

export const bookingAvailability = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const date = moment(req.body.date, "DD-MM-YY").toISOString();
    const fromTime = moment(req.body.time, "HH:mm")
      .subtract(1, "hours")
      .toISOString();
    const toTime = moment(req.body.time, "HH:mm").add(1, "hours").toISOString();

    const doctorId = req.body.doctorId;

    const appointments = await Appointment.findAll({
      where: {
        doctorId,
        date,
        time: {
          [Op.gte]: fromTime,
          [Op.lte]: toTime,
        },
      },
    });

    if (appointments.length > 0) {
      return res.status(200).send({
        message: "Appointments not Available at this time",
        success: true,
      });
    } else {
      return res.status(200).send({
        success: true,
        message: "Appointments available",
      });
    }
  } catch (error: any) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `BookingAvailability User_Controller ${error.message}`,
    });
  }
};

export const userAppointment = async (req: JwtPayload, res: Response) => {
  try {
    const appointments = await Appointment.findOne({
      where: {
        userId: req.user,
      },
    });
    res.status(200).send({
      success: true,
      message: "Users Appointments Fetch Successfully",
      data: appointments,
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `UserAppointment User_Controller ${error.message}`,
    });
  }
};
