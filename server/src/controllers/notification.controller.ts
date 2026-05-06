import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification.model';

export async function listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!;
    const notifications = await Notification.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!;
    await Notification.updateMany({ userId: new mongoose.Types.ObjectId(userId), read: false }, { read: true });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
