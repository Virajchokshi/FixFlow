import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Ticket } from '../models/Ticket.model';
import { Invoice } from '../models/Invoice.model';
import { Payment } from '../models/Payment.model';
import { User } from '../models/User.model';
import { Technician } from '../models/Technician.model';

export async function getAdminSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalTickets,
      openTickets,
      closedTickets,
      breachedTickets,
      totalUsers,
      recentTickets,
      prevWeekTickets,
      statusDistribution,
      priorityDistribution,
      slaDistribution,
      totalRevenue,
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $nin: ['CLOSED', 'REJECTED'] } }),
      Ticket.countDocuments({ status: 'CLOSED' }),
      Ticket.countDocuments({ slaStatus: 'breached', status: { $nin: ['CLOSED', 'REJECTED'] } }),
      User.countDocuments({ isActive: true }),
      Ticket.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Ticket.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Ticket.aggregate([
        { $match: { status: { $nin: ['CLOSED', 'REJECTED'] } } },
        { $group: { _id: '$slaStatus', count: { $sum: 1 } } },
      ]),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    const ticketTrend =
      prevWeekTickets > 0
        ? (((recentTickets - prevWeekTickets) / prevWeekTickets) * 100).toFixed(1)
        : '0';

    res.json({
      success: true,
      data: {
        metrics: {
          totalTickets,
          openTickets,
          closedTickets,
          breachedTickets,
          totalUsers,
          recentTickets,
          ticketTrend: parseFloat(ticketTrend),
          totalRevenue: totalRevenue[0]?.total ?? 0,
        },
        statusDistribution: statusDistribution.reduce(
          (acc, item) => ({ ...acc, [item._id]: item.count }),
          {} as Record<string, number>
        ),
        priorityDistribution: priorityDistribution.reduce(
          (acc, item) => ({ ...acc, [item._id]: item.count }),
          {} as Record<string, number>
        ),
        slaDistribution: slaDistribution.reduce(
          (acc, item) => ({ ...acc, [item._id]: item.count }),
          {} as Record<string, number>
        ),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTechnicianDashboard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { role, userId } = req.user!;

    let technicianFilter: Record<string, unknown> = {};
    if (role === 'technician') {
      technicianFilter = { assignedTo: new mongoose.Types.ObjectId(userId) };
    }

    const [
      assignedTickets,
      inProgressTickets,
      completedThisMonth,
      technicians,
    ] = await Promise.all([
      Ticket.find({
        ...technicianFilter,
        status: { $in: ['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'] },
      })
        .populate('submittedBy', 'name')
        .populate('assignedTo', 'name')
        .sort({ priority: 1, createdAt: 1 })
        .limit(10),
      Ticket.countDocuments({ ...technicianFilter, status: 'IN_PROGRESS' }),
      Ticket.countDocuments({
        ...technicianFilter,
        status: 'CLOSED',
        closedAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      }),
      Technician.find()
        .populate('userId', 'name email')
        .sort({ currentWorkload: -1 })
        .limit(10),
    ]);

    res.json({
      success: true,
      data: {
        assignedTickets,
        metrics: {
          inProgressTickets,
          completedThisMonth,
          totalAssigned: assignedTickets.length,
        },
        technicianWorkload: technicians.map((t) => ({
          technician: t.userId,
          workload: t.currentWorkload,
          availability: t.availability,
          specialization: t.specialization,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}
