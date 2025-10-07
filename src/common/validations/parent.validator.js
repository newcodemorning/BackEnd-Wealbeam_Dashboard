const Joi = require('joi');

const parentSchema = Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    date_of_birth: Joi.date().iso().required(),
    profile_image: Joi.string().allow('', null),
    gender: Joi.string().valid('Male', 'Female').required(),
    second_email: Joi.string().email().allow('', null),
    first_phone: Joi.string().required(),
    second_phone: Joi.string().allow('', null),
    createdAt: Joi.date().iso(),
    user: Joi.string().hex().length(24).required(),
    students:Joi.array().items(Joi.string().hex().length(24))
});

const updateParentSchema = parentSchema.fork(
    ['first_name', 'last_name', 'date_of_birth', 'gender', 'first_phone'],
    schema => schema.optional()
);

module.exports = {
    parentSchema,
    updateParentSchema
}; 