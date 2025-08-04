const Joi = require('joi');

const teacherSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
    }),
    password: Joi.string()
        .min(8)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        }),
    first_name: Joi.string().required().messages({
        'string.empty': 'First name is required',
        'any.required': 'First name is required'
    }),
    last_name: Joi.string().allow('', null),
    photo: Joi.string().uri().allow('').optional().messages({
        'string.uri': 'Photo must be a valid URL'
    }),
    age: Joi.number().integer().min(18).max(100).optional().messages({
        'number.base': 'Age must be a number',
        'number.integer': 'Age must be an integer',
        'number.min': 'Age must be at least 18',
        'number.max': 'Age cannot be more than 100'
    }),
    title: Joi.string().valid('Junior', 'Senior').optional().messages({
        'string.empty': 'Title cannot be empty',
        'any.only': 'Title must be either Junior or Senior'
    }),
    gender: Joi.string().valid('Male', 'Female').required().messages({
        'string.empty': 'Gender is required',
        'any.only': 'Gender must be either Male or Female',
        'any.required': 'Gender is required'
    }),
    schoolId: Joi.string().hex().length(24).optional().messages({
        'string.hex': 'School ID must be a valid hexadecimal value',
        'string.length': 'School ID must be 24 characters long'
    }),
    classes: Joi.array().items(
        Joi.string().hex().length(24)
            .optional()
            .messages({
                'array.base': 'Classes must be an array of Class IDs',
                'string.hex': 'Each Class ID must be a valid hexadecimal value',
                'string.length': 'Each Class ID must be 24 characters long'
            }))
});

const updateTeacherSchema = Joi.object({
    email: Joi.string().email().optional().messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
    }),
    password: Joi.string()
        .min(8)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
        .optional()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        }),
    first_name: Joi.string().optional().messages({
        'string.empty': 'First name cannot be empty'
    }),
    last_name: Joi.string().optional().messages({
        'string.empty': 'Last name cannot be empty'
    }),
    photo: Joi.string().uri().allow('').optional().messages({
        'string.uri': 'Photo must be a valid URL'
    }),
    age: Joi.number().integer().min(18).max(100).optional().messages({
        'number.base': 'Age must be a number',
        'number.integer': 'Age must be an integer',
        'number.min': 'Age must be at least 18',
        'number.max': 'Age cannot be more than 100'
    }),
    title: Joi.string().valid('Junior', 'Senior').optional().messages({
        'string.empty': 'Title cannot be empty',
        'any.only': 'Title must be either Junior or Senior'
    }),
    gender: Joi.string().valid('Male', 'Female').optional().messages({
        'string.empty': 'Gender cannot be empty',
        'any.only': 'Gender must be either Male or Female'
    }),
    school: Joi.forbidden(),
    classes: Joi.forbidden() // Typically classes would be managed through separate endpoints
}).min(1); // At least one field must be provided for update

module.exports = {
    teacherSchema,
    updateTeacherSchema
};