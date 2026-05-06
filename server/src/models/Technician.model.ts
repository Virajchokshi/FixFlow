import mongoose, { Document, Schema } from 'mongoose';

export type TechnicianAvailability = 'available' | 'busy' | 'off';

export interface ITechnician extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  specialization: string;
  currentWorkload: number;
  availability: TechnicianAvailability;
  createdAt: Date;
  updatedAt: Date;
}

const technicianSchema = new Schema<ITechnician>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true, trim: true },
    currentWorkload: { type: Number, default: 0, min: 0 },
    availability: {
      type: String,
      enum: ['available', 'busy', 'off'],
      default: 'available',
    },
  },
  { timestamps: true }
);

technicianSchema.index({ userId: 1 });
technicianSchema.index({ availability: 1 });

export const Technician = mongoose.model<ITechnician>('Technician', technicianSchema);
