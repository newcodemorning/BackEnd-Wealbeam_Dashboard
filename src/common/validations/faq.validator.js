const Joi = require('joi');

const faqSchema = Joi.object({
    question: Joi.string().required(),
    answer: Joi.string().required(),
    created_at: Joi.date().iso(),
    updated_at: Joi.date().iso()
});

const updateFaqSchema = faqSchema.fork(
    ['question', 'answer'],
    schema => schema.optional()
);

module.exports = {
    faqSchema,
    updateFaqSchema
}; 