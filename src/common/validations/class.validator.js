const Joi = require('joi');

const classSchema = Joi.object({
    ClassName: Joi.string().required().messages({
        'string.empty': 'Class name is required',
        'any.required': 'Class name is required'
    }),
    SelectDate: Joi.date().iso().required().messages({
        'date.base': 'Select date must be a valid date',
        'date.format': 'Select date must be in ISO format (YYYY-MM-DD)',
        'any.required': 'Select date is required'
    }),
    Subject: Joi.string().optional().messages({
        'string.empty': 'Subject cannot be empty'
    }),
    schoolId: Joi.string().hex().length(24).required().messages({
        'string.hex': 'School ID must be a valid hexadecimal value',
        'string.length': 'School ID must be 24 characters long',
        'any.required': 'School ID is required'
    }),
    teacherId: Joi.string().hex().length(24).optional().allow(null).messages({
        'string.hex': 'Teacher ID must be a valid hexadecimal value',
        'string.length': 'Teacher ID must be 24 characters long'
    })
});

const updateClassSchema = Joi.object({
    ClassName: Joi.string().optional().messages({
        'string.empty': 'Class name cannot be empty'
    }),
    SelectDate: Joi.date().iso().optional().messages({
        'date.base': 'Select date must be a valid date',
        'date.format': 'Select date must be in ISO format (YYYY-MM-DD)'
    }),
    Subject: Joi.string().optional().messages({
        'string.empty': 'Subject cannot be empty'
    }),
    school: Joi.forbidden(),
    teacher: Joi.forbidden(),
    students: Joi.forbidden() // Typically students would be managed through separate endpoints
}).min(1); // At least one field must be provided for update

module.exports = {
    classSchema,
    updateClassSchema
};