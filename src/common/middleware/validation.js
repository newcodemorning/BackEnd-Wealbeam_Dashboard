const validate = (schema, property = 'body') => async (req, res, next) => {
    try {
        await schema.validateAsync(req[property], {
            abortEarly: false,
            context: {
                id: req.params.id,
                method: req.method 
            }
        });
        next();
    } catch (error) {
        if (error.details) {
            // If it's a Joi validation error
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            return res.status(422).json({ 
                status: 'error',
                errors 
            });
        }
        // Handle unexpected errors
        console.error("Validation Error:", error);
        return res.status(500).json({ 
            status: 'error',
            message: "An unexpected error occurred during validation." 
        });
    }
};

module.exports = { validate };