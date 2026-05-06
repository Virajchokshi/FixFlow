import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'admin' | 'technician' | 'user';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'technician', 'user'],
      default: 'user',
      required: true,
    },
    isActive: { type: Boolean, default: true },
    phone: { type: String, trim: true },
    department: { type: String, trim: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
