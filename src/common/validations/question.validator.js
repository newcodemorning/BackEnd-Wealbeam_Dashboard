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
    isDanger: Joi.boolean().optional()
});

const questionSchema = Joi.object({
    text: Joi.object({
        ar: Joi.string().required(),
        en: Joi.string().required()
    }).required(),
    type: Joi.string().valid('yesno', 'dropdown', 'slider', 'radiobutton').required(),
    order: Joi.number().integer().min(1).required(),
    dangerAnswer: Joi.when('type', {
        is: 'yesno',
        then: Joi.string().required(),
        otherwise: Joi.string().optional()
    }),
    options: Joi.array().items(optionSchema).when('type', {
        is: Joi.valid('dropdown', 'radiobutton'),
        then: Joi.array().min(2),
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