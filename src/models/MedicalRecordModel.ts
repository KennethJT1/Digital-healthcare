import mongoose, { Schema, Document } from "mongoose";

interface IMedicalRecord extends Document {
  patientId: string;
  appointmentId: string;
  doctorId: string;
  records: string[];
  date: Date;
}

const medicalRecordSchema = new Schema<IMedicalRecord>({
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  appointmentId: { type: String, required: true },
  records: {
    type: [String],
    required: true,
  },
  date: { type: Date, default: Date.now },
});

export const MedicalRecord = mongoose.model<IMedicalRecord>(
  "MedicalRecord",
  medicalRecordSchema
);
