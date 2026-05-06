import { Request, Response, NextFunction } from 'express';
import { Ticket } from '../models/Ticket.model';
import { Feedback } from '../models/Feedback.model';
import { User } from '../models/User.model';

export async function getAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      byCategory,
      byStatus,
      byPriority,
      dailyTrend,
      slaBreakdown,
      resolutionTime,
      techPerformance,
    ] = await Promise.all([
      // Tickets by category
      Ticket.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Tickets by status
      Ticket.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Tickets by priority
      Ticket.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),

      // Daily ticket creation trend — last 30 days
      Ticket.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // SLA breakdown (open tickets only)
      Ticket.aggregate([
        { $match: { status: { $nin: ['CLOSED', 'REJECTED'] } } },
        { $group: { _id: '$slaStatus', count: { $sum: 1 } } },
      ]),

      // Average resolution time in hours per category (closed tickets)
      Ticket.aggregate([
        { $match: { status: 'CLOSED', closedAt: { $exists: true } } },
        {
          $project: {
            category: 1,
            resolutionHours: {
              $divide: [
                { $subtract: ['$closedAt', '$createdAt'] },
                3_600_000,
              ],
            },
          },
        },
        {
          $group: {
            _id: '$category',
            avgHours: { $avg: '$resolutionHours' },
            count: { $sum: 1 },
          },
        },
        { $sort: { avgHours: -1 } },
      ]),

      // Technician performance
      Ticket.aggregate([
        {
          $match: {
            assignedTo: { $exists: true },
            status: { $in: ['COMPLETED', 'CLOSED'] },
          },
        },
        {
          $group: {
            _id: '$assignedTo',
            resolved: { $sum: 1 },
            avgResolutionHours: {
              $avg: {
                $cond: [
                  { $and: ['$closedAt', '$createdAt'] },
                  { $divide: [{ $subtract: ['$closedAt', '$createdAt'] }, 3_600_000] },
                  null,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        { $match: { 'user.role': 'technician' } },
        {
          $lookup: {
            from: 'feedbacks',
            localField: '_id',
            foreignField: 'technicianId',
            as: 'feedbacks',
          },
        },
        {
          $project: {
            name: '$user.name',
            resolved: 1,
            avgResolutionHours: { $round: ['$avgResolutionHours', 1] },
            avgRating: {
              $cond: [
                { $gt: [{ $size: '$feedbacks' }, 0] },
                { $round: [{ $avg: '$feedbacks.rating' }, 1] },
                null,
              ],
            },
            ratingCount: { $size: '$feedbacks' },
          },
        },
        { $sort: { resolved: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Total tickets for summary
    const [totalTickets, openTickets] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $nin: ['CLOSED', 'REJECTED'] } }),
    ]);

    res.json({
      success: true,
      data: {
        summary: { totalTickets, openTickets },
        byCategory: byCategory.map((d) => ({ category: d._id, count: d.count })),
        byStatus: byStatus.map((d) => ({ status: d._id, count: d.count })),
        byPriority: byPriority.map((d) => ({ priority: d._id, count: d.count })),
        dailyTrend: dailyTrend.map((d) => ({ date: d._id, count: d.count })),
        slaBreakdown: slaBreakdown.reduce(
          (acc, d) => ({ ...acc, [d._id]: d.count }),
          { on_track: 0, at_risk: 0, breached: 0 } as Record<string, number>
        ),
        resolutionTime: resolutionTime.map((d) => ({
          category: d._id,
          avgHours: Math.round(d.avgHours ?? 0),
          count: d.count,
        })),
        technicianPerformance: techPerformance,
      },
    });
  } catch (error) {
    next(error);
  }
}
