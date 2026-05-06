import { Counter } from '../models/Counter.model';

type NumberPrefix = 'TKT' | 'EST' | 'INV';

export async function generateAutoNumber(prefix: NumberPrefix): Promise<string> {
  const year = new Date().getFullYear();
  const counterName = `${prefix}-${year}`;

  const counter = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seq = counter.seq.toString().padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
}
