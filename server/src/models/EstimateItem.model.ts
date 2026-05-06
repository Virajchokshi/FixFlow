import mongoose, { Document, Schema } from 'mongoose';

export type EstimateItemType = 'labor' | 'parts' | 'overhead';

export interface IEstimateItem extends Document {
  _id: mongoose.Types.ObjectId;
  estimateId: mongoose.Types.ObjectId;
  type: EstimateItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

const estimateItemSchema = new Schema<IEstimateItem>({
  estimateId: { type: Schema.Types.ObjectId, ref: 'Estimate', required: true },
  type: {
    type: String,
    enum: ['labor', 'parts', 'overhead'],
    required: true,
  },
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
});

estimateItemSchema.index({ estimateId: 1 });

export const EstimateItem = mongoose.model<IEstimateItem>('EstimateItem', estimateItemSchema);
