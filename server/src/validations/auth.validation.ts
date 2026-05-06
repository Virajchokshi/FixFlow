import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(100).required(),
  role: Joi.string().valid('admin', 'technician', 'user').default('user'),
  phone: Joi.string().optional().allow(''),
  department: Joi.string().optional().allow(''),
  specialization: Joi.string().optional().allow(''),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
