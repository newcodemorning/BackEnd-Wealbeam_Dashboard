const Joi = require('joi');

const createIncidentSchema = Joi.object({
    dateTime: Joi.date().default(Date.now),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    type: Joi.string().valid('physical', 'emotional', 'illness', 'emergency', 'fight', 'other').required(),
    description: Joi.string().required(),
    student: Joi.string().required()
});

module.exports = {
    createIncidentSchema
};