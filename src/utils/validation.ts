import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  address: Joi.string().optional().allow(null, ""),
  medicalHistory: Joi.object().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  address: Joi.string().optional().allow(null, ""),
  medicalHistory: Joi.object().optional(),
});

export const doctorValidationSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string()
    .pattern(/^\d{10,15}$/)
    .required(),
  email: Joi.string().email().required(),
  website: Joi.string().uri().allow(null, ""),
  address: Joi.string().required(),
  specialization: Joi.alternatives().try(
    Joi.string().required(),
    Joi.array().items(Joi.string()).min(1).required()
  ).required(),  experience: Joi.string().required(),
  feesPerConsultation: Joi.number().positive().required(),
  timings: Joi.object().required(),
});

export const appointmentSchema = Joi.object({
  doctorId: Joi.string().uuid().required(),
  testType: Joi.array().items(Joi.string()).required(),
  date: Joi.date().iso().required(),
  time: Joi.date().iso().required(),
});

export const updateDoctorSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  website: Joi.string().uri().optional(),
  address: Joi.string().optional(),
  specialization: Joi.array().items(Joi.string()).optional(),
  experience: Joi.string().optional(),
  feesPerConsultation: Joi.number().optional(),
  status: Joi.string().valid("pending", "approved").optional(),
  timings: Joi.object().optional(),
});

export const medicalHistorySchema = Joi.object({
  appointmentId: Joi.string().required(),
  date: Joi.date().iso().required(),
});
