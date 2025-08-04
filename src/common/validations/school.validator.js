const Joi = require('joi');

// Validation for creating a new school
const schoolSchema = Joi.object({
    schoolName: Joi.string().required().messages({
        'string.empty': 'School name is required',
        'any.required': 'School name is required'
    }), email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
    }),
    password: Joi.string()
        .min(8)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_])'))
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        }),
    address: Joi.string().required().messages({
        'string.empty': 'Address is required',
        'any.required': 'Address is required'
    }),
    phone: Joi.string().required().messages({
        'string.empty': 'Phone number is required',
        'any.required': 'Phone number is required'
    }),
    subscriptionEndDate: Joi.date().iso().required().messages({
        'date.base': 'Subscription end date must be a valid date',
        'date.format': 'Subscription end date must be in ISO format (YYYY-MM-DD)',
        'any.required': 'Subscription end date is required'
    }),
    language: Joi.string().optional(),
});


const updateSchoolSchema = Joi.object({
    schoolName: Joi.string().optional().messages({
        'string.empty': 'School name cannot be empty'
    }), email: Joi.string().email().optional().messages({
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
    address: Joi.string().optional().messages({
        'string.empty': 'Address cannot be empty'
    }),
    phone: Joi.string().optional().messages({
        'string.empty': 'Phone number cannot be empty'
    }),
    subscriptionEndDate: Joi.date().iso().optional().messages({
        'date.base': 'Subscription end date must be a valid date',
        'date.format': 'Subscription end date must be in ISO format (YYYY-MM-DD)'
    }),
    language: Joi.string().optional(),
    teachers: Joi.forbidden(), // Not allowed in update
    classes: Joi.forbidden()   // Not allowed in update
}).min(1); // At least one field must be present for update

module.exports = {
    schoolSchema,
    updateSchoolSchema
};