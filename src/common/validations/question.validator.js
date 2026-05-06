const Joi = require('joi');

const optionSchema = Joi.object({
    text: Joi.object({
        ar: Joi.string().required(),
        en: Joi.string().required()
    }).required(),
    name: Joi.object({
        ar: Joi.string().optional().allow(''),
        en: Joi.string().optional().allow('')
    }).optional(),
    score: Joi.number().integer().min(1).max(10).required(),
    isDanger: Joi.boolean().optional()
});

const questionSchema = Joi.object({
    text: Joi.object({
        ar: Joi.string().required(),
        en: Joi.string().required()
    }).required(),
    type: Joi.string().valid('yesno', 'dropdown', 'slider', 'radiobutton').required(),
    // Backward compatible: question-level score is no longer the primary model.
    // For option-based questions, scoring comes from the chosen option's score.
    score: Joi.number().integer().min(1).max(10).optional(),
    slider: Joi.when('type', {
        is: 'slider',
        then: Joi.object({
            min: Joi.number().required(),
            max: Joi.number().required(),
            step: Joi.number().positive().optional().default(1)
        }).required().custom((v, helpers) => {
            if (v.max <= v.min) return helpers.error('any.invalid');
            return v;
        }, 'slider range validation'),
        otherwise: Joi.forbidden()
    }),
    order: Joi.number().integer().min(1).required(),
    dangerAnswer: Joi.when('type', {
        is: 'yesno',
        then: Joi.string().required(),
        otherwise: Joi.string().optional()
    }),
    options: Joi.array().items(optionSchema).when('type', {
        is: Joi.valid('dropdown', 'radiobutton', 'yesno'),
        then: Joi.array().min(2).required(),
        otherwise: Joi.array()
    }).optional()
});

const createFormSchema = Joi.object({
    subject: Joi.string().required(),
    questions: Joi.array().items(questionSchema).min(1).required()
});

const updateFormSchema = Joi.object({
    subject: Joi.string(),
    questions: Joi.array().items(questionSchema).min(1)
}).min(1);

module.exports = {
    createFormSchema,
    updateFormSchema,
    questionSchema
};