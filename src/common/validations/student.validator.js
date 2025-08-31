const Joi = require('joi');

const studentSchema = Joi.object({
    first_name: Joi.object({
        ar: Joi.string().optional().messages({
            'string.empty': 'Arabic first name cannot be empty'
        }),
        en: Joi.string().required().messages({
            'string.empty': 'English first name is required',
            'any.required': 'English first name is required'
        })
    }).required().messages({
        'any.required': 'First name is required'
    }),
    last_name: Joi.object({
        ar: Joi.string().optional().messages({
            'string.empty': 'Arabic last name cannot be empty'
        }),
        en: Joi.string().optional().messages({
            'string.empty': 'English last name cannot be empty'
        })
    }).optional(),
    first_email: Joi.string().email().allow('').optional().messages({
        'string.email': 'First email must be a valid email address'
    }),
    second_email: Joi.string().email().allow('').optional().messages({
        'string.email': 'Second email must be a valid email address'
    }),
    photo: Joi.string().allow('').optional().messages({
        'string.base': 'Photo must be a string'
    }),
    first_phone: Joi.string().required().messages({
        'string.empty': 'Primary phone number is required',
        'any.required': 'Primary phone number is required'
    }),
    second_phone: Joi.string().allow('').optional().messages({
        'string.empty': 'Secondary phone cannot be empty'
    }),
    date_of_birth: Joi.date().iso().max('now').required().messages({
        'date.base': 'Date of birth must be a valid date',
        'date.format': 'Date of birth must be in ISO format (YYYY-MM-DD)',
        'date.max': 'Date of birth cannot be in the future',
        'any.required': 'Date of birth is required'
    }),
    grade: Joi.string().required().messages({
        'string.empty': 'Grade is required',
        'any.required': 'Grade is required'
    }),
    gender: Joi.string().valid('Male', 'Female').required().messages({
        'string.empty': 'Gender is required',
        'any.only': 'Gender must be either Male or Female',
        'any.required': 'Gender is required'
    }),
    classId: Joi.string().hex().length(24).optional().messages({
        'string.hex': 'Class ID must be a valid hexadecimal value',
        'string.length': 'Class ID must be 24 characters long'
    }),
    parentId: Joi.string().hex().length(24).optional().messages({
        'string.hex': 'Parent ID must be a valid hexadecimal value',
        'string.length': 'Parent ID must be 24 characters long'
    })
});

const updateStudentSchema = Joi.object({
    first_name: Joi.object({
        ar: Joi.string().optional().messages({
            'string.empty': 'Arabic first name cannot be empty'
        }),
        en: Joi.string().optional().messages({
            'string.empty': 'English first name cannot be empty'
        })
    }),
    last_name: Joi.object({
        ar: Joi.string().optional().messages({
            'string.empty': 'Arabic last name cannot be empty'
        }),
        en: Joi.string().optional().messages({
            'string.empty': 'English last name cannot be empty'
        })
    }),
    second_email: Joi.string().email().allow('').optional().messages({
        'string.email': 'Second email must be a valid email address'
    }),
    photo: Joi.string().allow('').optional().messages({
        'string.base': 'Photo must be a string'
    }),
    first_phone: Joi.string().optional().messages({
        'string.empty': 'Primary phone number cannot be empty'
    }),
    second_phone: Joi.string().allow('').optional().messages({
        'string.empty': 'Secondary phone cannot be empty'
    }),
    date_of_birth: Joi.date().iso().max('now').optional().messages({
        'date.base': 'Date of birth must be a valid date',
        'date.format': 'Date of birth must be in ISO format (YYYY-MM-DD)',
        'date.max': 'Date of birth cannot be in the future'
    }),
    gender: Joi.string().valid('Male', 'Female').optional().messages({
        'string.empty': 'Gender cannot be empty',
        'any.only': 'Gender must be either Male or Female'
    }),
    grade: Joi.string().messages({
        'string.empty': 'Grade is required',
        'any.required': 'Grade is required'
    }),
    class: Joi.forbidden(), 
    parent: Joi.forbidden() 
}).min(1);

module.exports = {
    studentSchema,
    updateStudentSchema
};