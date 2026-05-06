import Joi from 'joi';

export const createTicketSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(5000).required(),
  category: Joi.string()
    .valid('electrical', 'plumbing', 'hvac', 'structural', 'it', 'other')
    .required(),
  customCategory: Joi.string().max(200).optional().allow(''),
  location: Joi.string().min(2).max(200).required(),
  imageBase64: Joi.string().min(1).required().messages({
    'string.empty': 'An image is required',
    'any.required': 'An image is required',
  }),
});

export const setPrioritySchema = Joi.object({
  priority: Joi.string().valid('critical', 'high', 'medium', 'low').required(),
});

export const updateTicketSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  description: Joi.string().min(10).max(5000),
  category: Joi.string().valid('electrical', 'plumbing', 'hvac', 'structural', 'it', 'other'),
  priority: Joi.string().valid('critical', 'high', 'medium', 'low'),
  location: Joi.string().min(2).max(200),
}).min(1);

export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'SUBMITTED',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
      'ASSIGNED',
      'IN_PROGRESS',
      'ON_HOLD',
      'COMPLETED',
      'CLOSED'
    )
    .required(),
  reason: Joi.string().max(500).optional().allow(''),
});

export const assignTicketSchema = Joi.object({
  technicianId: Joi.string().required(),
});

export const addCommentSchema = Joi.object({
  body: Joi.string().min(1).max(2000).required(),
});
