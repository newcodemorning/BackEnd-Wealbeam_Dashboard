const { Form } = require('../models/question.model');
const questionService = require('../services/question.service');
const { createFormSchema, updateFormSchema } = require('../common/validations/question.validator');
const Response = require('../models/response.model');

exports.createForm = async (req, res) => {
    try {
        const { error } = createFormSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const form = await questionService.createForm(req.body);
        res.status(201).json(form);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getForm = async (req, res) => {
    try {
        const { subject } = req.params;
        const lang = req.lang || 'en';

        const form = await questionService.getFormBySubject(subject, lang);

        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }

        res.json(form);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



exports.getDailyForm = async (req, res) => {
    try {
        const lang = req.lang || 'en';
        const studentId = req.user.roleId;
        const lastSubmitted = await Response.findOne({ student: studentId }).sort({ timestamp: -1 });
        if (lastSubmitted) {
            const lastDate = new Date(lastSubmitted.timestamp);
            const today = new Date();
            if (lastDate.toDateString() === today.toDateString()) {
                return res.status(208).json(
                    {
                        success: false,
                        status: 208,
                        message: 'Daily form already submitted today, wait until tomorrow to submit again',
                        lastSubmitted: lastSubmitted.timestamp,
                    }
                );
            }
        }
        const form = await questionService.getDailyForm(lang);
        if (!form) {
            return res.status(404).json({ error: 'Daily form not found' });
        }
        res.json(form);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllForms = async (req, res) => {
    try {
        const forms = await questionService.getAllForms();
        res.json(forms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateForm = async (req, res) => {
    try {
        const { subject } = req.params;
        const { error } = updateFormSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const form = await questionService.updateForm(subject, req.body);
        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }

        res.json(form);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteForm = async (req, res) => {
    try {
        const { subject } = req.params;
        const result = await questionService.deleteForm(subject);

        if (!result) {
            return res.status(404).json({ error: 'Form not found' });
        }

        res.json({ message: 'Form deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getFormById = async (req, res) => {
    try {
        const { id } = req.params;
        const lang = req.lang || 'en';

        const form = await questionService.getFormById(id, lang);
        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }
        res.json(form);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateFormById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = updateFormSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const form = await questionService.updateFormById(id, req.body);
        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }
        res.json(form);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteFormById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await questionService.deleteFormById(id);
        if (!result) {
            return res.status(404).json({ error: 'Form not found' });
        }
        res.json({ message: 'Form deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};