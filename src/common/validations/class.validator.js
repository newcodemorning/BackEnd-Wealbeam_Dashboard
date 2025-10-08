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


// TODO: Add validation to prevent clients from sending school, teacher, and students fields

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

    schoolId: Joi.string().optional().allow(null).messages({
        'string.base': 'schoolId must be a string',
    }),
    teacherId: Joi.string().optional().allow(null).messages({
        'string.base': 'teacherId must be a string',
    }),

    // school: Joi.forbidden(),
    // teacher: Joi.forbidden(),
    // students: Joi.forbidden()

}).min(1); // لازم يبقى في حقل واحد على الأقل للتحديث


const updateClassTeacherSchema = Joi.object({
    classId: Joi.string().hex().length(24).required().messages({
        'string.hex': 'Class ID must be a valid hexadecimal value',
        'string.length': 'Class ID must be 24 characters long',
        'any.required': 'Class ID is required'
    }),
    teacherId: Joi.string().hex().length(24).required().messages({
        'string.hex': 'Teacher ID must be a valid hexadecimal value',
        'string.length': 'Teacher ID must be 24 characters long',
        'any.required': 'Teacher ID is required'
    })
});



module.exports = {
    classSchema,
    updateClassSchema,
    updateClassTeacherSchema
};