import Joi from 'joi';

export const createSLAPolicySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  responseTimeHours: Joi.number().integer().min(1).max(168).required(),
  resolutionTimeHours: Joi.number().integer().min(1).max(720).required(),
  description: Joi.string().trim().max(500).optional().allow(''),
  isActive: Joi.boolean().optional(),
});

export const updateSLAPolicySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  responseTimeHours: Joi.number().integer().min(1).max(168).optional(),
  resolutionTimeHours: Joi.number().integer().min(1).max(720).optional(),
  description: Joi.string().trim().max(500).optional().allow(''),
  isActive: Joi.boolean().optional(),
});
