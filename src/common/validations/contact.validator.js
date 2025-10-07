const Joi = require('joi');

const contactSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    message: Joi.string().required(),
    createdAt: Joi.date().iso()
});

module.exports = {
    contactSchema
}; 