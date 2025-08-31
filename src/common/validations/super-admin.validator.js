const Joi = require('joi');

const superAdminSchema = Joi.object({
    firstName: Joi.object({
        ar: Joi.string().required(),
        en: Joi.string().required()
    }),
    lastName: Joi.object({
        ar: Joi.string().required(),
        en: Joi.string().required()
    }),
    address: Joi.string().allow('', null),
    photo: Joi.string().allow('', null),
    phoneNumber: Joi.string().required(),
    firstEmail: Joi.string().email().required(),
    secondEmail: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const updateSuperAdminSchema = superAdminSchema.fork(
    ['firstName', 'lastName', 'phoneNumber', 'firstEmail', 'secondEmail', 'password'],
    schema => schema.optional()
);

module.exports = {
    superAdminSchema,
    updateSuperAdminSchema
};