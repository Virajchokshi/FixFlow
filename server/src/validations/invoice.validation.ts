import Joi from 'joi';

export const createInvoiceSchema = Joi.object({
  ticketId: Joi.string().required(),
  estimateId: Joi.string().optional(),
  dueDate: Joi.date().iso().optional(),
  taxRate: Joi.number().min(0).max(100).default(0),
  notes: Joi.string().max(2000).optional().allow(''),
});

export const updateInvoiceSchema = Joi.object({
  dueDate: Joi.date().iso(),
  notes: Joi.string().max(2000).optional().allow(''),
  taxRate: Joi.number().min(0).max(100),
}).min(1);
