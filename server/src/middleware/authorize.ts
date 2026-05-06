import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

type Role = 'admin' | 'technician' | 'user';

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Role '${req.user.role}' is not authorized for this action`));
    }

    next();
  };
}
