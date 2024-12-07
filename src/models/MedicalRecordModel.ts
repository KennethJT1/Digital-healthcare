import mongoose, { Schema, Document } from 'mongoose';

interface IMedicalRecord extends Document {
  userId: number;
  record: string;
  createdAt: Date;
}

const medicalRecordSchema = new Schema<IMedicalRecord>(
  {
    userId: { type: Number, required: true },
    record: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }
);

export const MedicalRecord = mongoose.model<IMedicalRecord>('MedicalRecord', medicalRecordSchema);
