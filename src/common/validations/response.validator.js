const Joi = require('joi');
const { Form } = require('../../models/question.model');

const answerSchema = Joi.object({
    question: Joi.object({
        id: Joi.string().required(),
        text: Joi.string().required(),
        type: Joi.string().valid('yesno', 'dropdown', 'slider', 'radiobutton').required()
    }).required(),
    answer: Joi.string().required(),
});

const responseSchema = Joi.object({
    form: Joi.string().required(),
    answers: Joi.array().items(answerSchema).min(1).required(),
    timestamp: Joi.date().iso()
});

exports.validateFormResponse = async (req, res, next) => {
    try {
        const form = await Form.findById(req.body.form);
        if (!form) throw new Error('Form not found');

        const questionIds = form.questions.map(q => q._id.toString());
        const responseIds = req.body.answers.map(a => a.question.id.toString());

        // Check for missing questions
        const missing = questionIds.filter(id => !responseIds.includes(id));
        if (missing.length) {
            return res.status(400).json({
                success: false,
                error: `Missing answers for ${missing.length} questions`
            });
        }

        // Check for extra questions
        const extra = responseIds.filter(id => !questionIds.includes(id));
        if (extra.length) {
            return res.status(400).json({
                success: false,
                error: `Invalid questions for form ${form.subject}`
            });
        }

        next();
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

module.exports = {
    responseSchema
};