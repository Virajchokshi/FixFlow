import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '../utils/ApiError';

export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });

    if (error) {
      const errors = error.details.map((d) => d.message);
      return next(ApiError.badRequest('Validation failed', errors));
    }

    next();
  };
}
