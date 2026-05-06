import { Request, Response, NextFunction } from 'express';
import { SLAPolicy } from '../models/SLAPolicy.model';
import { sweepAllTickets } from '../utils/slaEngine';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';

export async function listSLAPolicies(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const policies = await SLAPolicy.find().populate('createdBy', 'name email').sort({ priority: 1 });
    res.json({ success: true, data: policies });
  } catch (error) {
    next(error);
  }
}

export async function createSLAPolicy(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { priority, responseTimeHours, resolutionTimeHours } = req.body as {
      priority: string;
      responseTimeHours: number;
      resolutionTimeHours: number;
    };

    const existing = await SLAPolicy.findOne({ priority });
    if (existing) throw ApiError.conflict(`SLA policy for '${priority}' already exists`);

    const policy = await SLAPolicy.create({
      priority,
      responseTimeHours,
      resolutionTimeHours,
      createdBy: new mongoose.Types.ObjectId(req.user!.userId),
    });

    res.status(201).json({ success: true, data: policy, message: 'SLA policy created' });
  } catch (error) {
    next(error);
  }
}

export async function updateSLAPolicy(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const policy = await SLAPolicy.findByIdAndUpdate(req.params['id'], req.body, {
      new: true,
      runValidators: true,
    });

    if (!policy) throw ApiError.notFound('SLA policy not found');

    res.json({ success: true, data: policy });
  } catch (error) {
    next(error);
  }
}

export async function triggerSweep(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await sweepAllTickets();
    res.json({ success: true, data: result, message: 'SLA sweep completed' });
  } catch (error) {
    next(error);
  }
}
