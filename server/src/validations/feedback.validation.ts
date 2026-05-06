import Joi from 'joi';

export const submitFeedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).optional().allow(''),
});
