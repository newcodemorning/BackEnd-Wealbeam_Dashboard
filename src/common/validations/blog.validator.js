const Joi = require('joi');


const blogSchema = Joi.object({
    'title[en]': Joi.string().required().messages({
        'string.empty': 'English title is required',
        'any.required': 'English title is required'
    }),
    'title[ar]': Joi.string().required().messages({
        'string.empty': 'Arabic title is required',
        'any.required': 'Arabic title is required'
    }),
    'content[en]': Joi.string().required().messages({
        'string.empty': 'English content is required',
        'any.required': 'English content is required'
    }),
    'content[ar]': Joi.string().required().messages({
        'string.empty': 'Arabic content is required',
        'any.required': 'Arabic content is required'
    }),
    slug: Joi.string()
        .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .required()
        .messages({
            'string.empty': 'Slug is required',
            'string.pattern.base': 'Slug should only contain lowercase letters, numbers, and hyphens',
            'any.required': 'Slug is required'
        }),
    tags: Joi.string().optional().allow('', null),
    category: Joi.string().optional().allow('', null),
    subcategory: Joi.string().optional().allow('', null),
    visibility: Joi.string()
        .valid('public', 'private', 'both')
        .optional()
        .default('public')
        .messages({
            'any.only': 'Visibility must be either public, private, or both'
        }),
    allowedSchools: Joi.string().optional().allow('', null),
    status: Joi.string()
        .valid('draft', 'published')
        .optional()
        .default('published')
        .messages({
            'any.only': 'Status must be either draft or published'
        }),
    isFeatured: Joi.alternatives()
        .try(
            Joi.boolean(),
            Joi.string().valid('true', 'false')
        )
        .optional()
        .default(false),
    isPinned: Joi.alternatives()
        .try(
            Joi.boolean(),
            Joi.string().valid('true', 'false')
        )
        .optional()
        .default(false)
}).unknown(true); // Allow file fields from multipart/form-data

const updateBlogSchema = Joi.object({
    'title[en]': Joi.string().optional().messages({
        'string.empty': 'English title cannot be empty'
    }),
    'title[ar]': Joi.string().optional().messages({
        'string.empty': 'Arabic title cannot be empty'
    }),
    'content[en]': Joi.string().optional().messages({
        'string.empty': 'English content cannot be empty'
    }),
    'content[ar]': Joi.string().optional().messages({
        'string.empty': 'Arabic content cannot be empty'
    }),
    slug: Joi.string()
        .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .optional()
        .messages({
            'string.pattern.base': 'Slug should only contain lowercase letters, numbers, and hyphens'
        }),
    tags: Joi.string().optional().allow('', null),
    category: Joi.string().optional().allow('', null),
    subcategory: Joi.string().optional().allow('', null),
    visibility: Joi.string()
        .valid('public', 'private', 'both')
        .optional()
        .messages({
            'any.only': 'Visibility must be either public, private, or both'
        }),
    allowedSchools: Joi.string().optional().allow('', null),
    status: Joi.string()
        .valid('draft', 'published')
        .optional()
        .messages({
            'any.only': 'Status must be either draft or published'
        }),
    isFeatured: Joi.alternatives()
        .try(
            Joi.boolean(),
            Joi.string().valid('true', 'false')
        )
        .optional(),
    isPinned: Joi.alternatives()
        .try(
            Joi.boolean(),
            Joi.string().valid('true', 'false')
        )
        .optional()
}).unknown(true);

module.exports = {
    blogSchema,
    updateBlogSchema
};