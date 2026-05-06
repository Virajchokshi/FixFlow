import Joi from 'joi';

const estimateItemSchema = Joi.object({
  type: Joi.string().valid('labor', 'parts', 'overhead').required(),
  description: Joi.string().min(1).max(500).required(),
  quantity: Joi.number().min(0).required(),
  unitPrice: Joi.number().min(0).required(),
});

export const createEstimateSchema = Joi.object({
  ticketId: Joi.string().required(),
  items: Joi.array().items(estimateItemSchema).min(1).required(),
  notes: Joi.string().max(2000).optional().allow(''),
  taxRate: Joi.number().min(0).max(100).default(0),
});

export const updateEstimateSchema = Joi.object({
  notes: Joi.string().max(2000).optional().allow(''),
  taxRate: Joi.number().min(0).max(100),
}).min(1);

export const addEstimateItemSchema = estimateItemSchema;

export const approveRejectEstimateSchema = Joi.object({
  reason: Joi.string().max(500).optional().allow(''),
});

export const requestRevisionSchema = Joi.object({
  notes: Joi.string().max(2000).optional().allow(''),
});
