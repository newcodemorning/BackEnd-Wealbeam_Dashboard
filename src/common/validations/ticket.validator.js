const Joi = require('joi');

const ticketSchema = Joi.object({
    category: Joi.string()
        .valid('academic', 'financial', 'behavior', 'technical', 'other')
        .required(),
    title: Joi.string()
        .required()
        .min(5)
        .max(200),
    question: Joi.string()
        .required()
        .min(10)
        .max(2000)
});

const replySchema = Joi.object({
    message: Joi.string()
        .required()
        .min(1)
        .max(2000)
});

const updateStatusSchema = Joi.object({
    status: Joi.string()
        .valid('open', 'pending', 'closed')
        .required()
});

const updatePrioritySchema = Joi.object({
    priority: Joi.string()
        .valid('low', 'medium', 'high')
        .required()
});

module.exports = {
    ticketSchema,
    replySchema,
    updateStatusSchema,
    updatePrioritySchema
};