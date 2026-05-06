import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export interface JwtPayload {
  userId: string;
  role: 'admin' | 'technician' | 'user';
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.token as string | undefined;

    if (!token) {
      throw ApiError.unauthorized('No authentication token provided');
    }

    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : ApiError.unauthorized('Invalid or expired token'));
  }
}
