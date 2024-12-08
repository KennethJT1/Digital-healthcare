import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import moment from "moment";
import { Op } from "sequelize";
import { OpenAI } from "openai";

import {
  appointmentSchema,
  doctorValidationSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "../utils/validation";
import User from "../models/userModel";
import { EXPIRESIN, JWT_SECRET, OPENAI_API_KEY, SALT_ROUNDS } from "../config";
import Doctor from "../models/doctorModel";
import Appointment from "../models/doctorAppointmentModel";
import { MedicalRecord } from "../models/MedicalRecordModel";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const RATE_LIMITS: Record<
  string,
  { rpm: number; rpd: number; tpm: number; batchQueueLimit: number }
> = {
  "gpt-3.5-turbo": {
    rpm: 3,
    rpd: 200,
    tpm: 40000,
    batchQueueLimit: 200000,
  },
};

let requestCount: Record<
  string,
  { rpm: number; rpd: number; tpm: number; lastRequestTime: number }
> = {
  "gpt-3.5-turbo": {
    rpm: 0,
    rpd: 0,
    tpm: 0,
    lastRequestTime: Date.now(),
  },
};

const checkRateLimit = (
  model: string,
  tokensUsed: number
): { allowed: boolean; message?: string } => {
  const currentTime: number = Date.now();
  const currentMinute: number = Math.floor(currentTime / 60000);

  if (
    Math.floor(requestCount[model].lastRequestTime / 60000) !== currentMinute
  ) {
    requestCount[model].rpm = 0;
    requestCount[model].lastRequestTime = currentTime;
  }

  requestCount[model].rpm += 1;
  requestCount[model].tpm += tokensUsed;

  if (requestCount[model].rpm > RATE_LIMITS[model].rpm) {
    return {
      allowed: false,
      message: "Rate limit exceeded for requests per minute.",
    };
  }
  if (requestCount[model].tpm > RATE_LIMITS[model].tpm) {
    return {
      allowed: false,
      message: "Rate limit exceeded for tokens per minute.",
    };
  }

  return { allowed: true };
};

export const virtualAssistant = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { message }: { message?: string } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    const tokensUsed: number = message.length * 2;

    const rateLimitStatus = checkRateLimit("gpt-3.5-turbo", tokensUsed);
    if (!rateLimitStatus.allowed) {
      return res.status(429).json({ message: rateLimitStatus.message });
    }

    const response: unknown = await openai.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "gpt-3.5-turbo",
    });

    const assistantResponse = (
      response as { choices: Array<{ message: { content: string } }> }
    ).choices[0].message.content;

    return res.status(200).json({
      assistantResponse,
    });
  } catch (error: unknown) {
    console.error("Error in virtual assistant:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return res.status(500).json({
      message: "Internal server error",
      error: errorMessage,
    });
  }
};

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

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isDoctor) {
      const doctor = await Doctor.findOne({ where: { userId: user.id } });
      if (!doctor) {
        return res.status(404).json({ message: "Doctor record not found" });
      }

      const token = jwt.sign(
        { id: doctor.id, email: user.email, role: "doctor" },
        JWT_SECRET,
        { expiresIn: EXPIRESIN }
      );

      return res.status(200).json({ message: "Login successful", token });
    }

    if (user.role === "admin") {
      const token = jwt.sign(
        { id: user.id, email: user.email, role: "admin" },
        JWT_SECRET,
        { expiresIn: EXPIRESIN }
      );

      return res.status(200).json({ message: "Login successful", token });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: "user" },
      JWT_SECRET,
      { expiresIn: EXPIRESIN }
    );

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

export const applyToBeADoctor = async (
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

    const existingDoctor = await Doctor.findOne({
      where: {
        firstName,
        lastName,
        phone,
        email,
        website,
      },
    });

    if (existingDoctor) {
      return res.status(400).json({
        message: "Doctor profile with these details already exists",
        success: false,
      });
    }

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

export const getMedicalHistory = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const patientId = req.user;
    const user = await User.findOne({ where: { id: patientId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const myMedicalHistory = await MedicalRecord.find({
      patientId: patientId,
    });

    if (!myMedicalHistory || myMedicalHistory.length === 0) {
      return res.status(404).json({ message: "Medical history not found" });
    }

    const formattedRecords = myMedicalHistory.map((record) => ({
      records: record.records,
      date: record.date,
    }));

    return res.status(200).json({
      medicalHistory: formattedRecords,
    });
  } catch (error: unknown) {
    console.error("Error retrieving medical history:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
