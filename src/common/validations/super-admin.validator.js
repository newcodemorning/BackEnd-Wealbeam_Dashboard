const Joi = require('joi');

const superAdminSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    address: Joi.string().allow('', null),
    photo: Joi.string().allow('', null),
    phoneNumber: Joi.string().required(),
    first_email: Joi.string().email().required(),
    secound_email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const updateSuperAdminSchema = superAdminSchema.fork(
    ['firstName', 'lastName', 'phoneNumber', 'first_email', 'secound_email', 'password'],
    schema => schema.optional()
);

module.exports = {
    superAdminSchema,
    updateSuperAdminSchema
}; 