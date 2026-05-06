import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Notification, NotificationType } from '../models/Notification.model';
import mongoose from 'mongoose';

interface JwtPayload {
  userId: string;
  role: string;
  name: string;
}

let io: SocketServer | null = null;

// userId → Set of socket IDs (one user can have multiple tabs open)
const userSockets = new Map<string, Set<string>>();

export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token =
      (socket.handshake.auth as Record<string, string>)['token'] ||
      socket.handshake.headers.cookie
        ?.split(';')
        .find((c) => c.trim().startsWith('token='))
        ?.split('=')[1];

    if (token) {
      try {
        const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
        (socket as Socket & { userId?: string }).userId = payload.userId;
      } catch {
        // invalid token — still allow connection, just no userId
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as Socket & { userId?: string }).userId;

    if (userId) {
      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId)!.add(socket.id);

      socket.on('disconnect', () => {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) userSockets.delete(userId);
        }
      });

      socket.on('mark_read', async (notificationId: string) => {
        await Notification.findByIdAndUpdate(notificationId, { read: true });
      });

      socket.on('mark_all_read', async () => {
        await Notification.updateMany({ userId, read: false }, { read: true });
      });
    }
  });

  return io;
}

export function broadcastToAll(event: string, payload?: unknown): void {
  if (io) {
    io.emit(event, payload);
  }
}

export async function sendNotification(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  ticketId?: string;
}): Promise<void> {
  const notification = await Notification.create({
    userId: new mongoose.Types.ObjectId(opts.userId),
    type: opts.type,
    title: opts.title,
    body: opts.body,
    ticketId: opts.ticketId ? new mongoose.Types.ObjectId(opts.ticketId) : undefined,
  });

  const socketIds = userSockets.get(opts.userId);
  if (io && socketIds && socketIds.size > 0) {
    socketIds.forEach((socketId) => {
      io!.to(socketId).emit('notification', {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        ticketId: notification.ticketId,
        read: false,
        createdAt: notification.createdAt,
      });
    });
  }
}
