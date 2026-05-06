import mongoose, { Document, Schema } from 'mongoose';

export interface ICounter extends Document {
  name: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.model<ICounter>('Counter', counterSchema);
