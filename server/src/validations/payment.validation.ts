import Joi from 'joi';

export const createPaymentSchema = Joi.object({
  invoiceId: Joi.string().required(),
  amount: Joi.number().min(0.01).required(),
  method: Joi.string().valid('bank_transfer', 'cash', 'card', 'cheque').required(),
  referenceNumber: Joi.string().min(1).max(100).required(),
  paymentDate: Joi.date().iso().required(),
});
