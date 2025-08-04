const Joi = require('joi');

const userSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().optional()
});

const updateUserSchema = userSchema.fork(
    ['email', 'password', 'role'],
    schema => schema.optional()
);

module.exports = {
    userSchema,
    updateUserSchema
}; 