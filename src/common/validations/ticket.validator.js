const Joi = require('joi');

const ticketSchema = Joi.object({
    fileUrl: Joi.string().allow('', null),
    category: Joi.string().required(),
    title: Joi.string().required(),
    question: Joi.string().required(),
    createdAt: Joi.date().iso()
});

const updateTicketSchema = ticketSchema.fork(
    ['category', 'title', 'question'],
    schema => schema.optional()
);

module.exports = {
    ticketSchema,
    updateTicketSchema
}; 