const responseService = require('../services/response.service');

exports.submitFormResponse = async (req, res) => {
    try {
        const { student, form, answers } = req.body;

        if (!Array.isArray(answers) || !answers.length) {
            throw new Error('Answers must be a non-empty array');
        }

        const response = await responseService.processFormResponse(student, form, answers);

        res.json({
            success: true,
            data: {
                form: response.form,
                answered: response.answers.length,
                status: response.answers.reduce((acc, curr) => {
                    acc[curr.status] = (acc[curr.status] || 0) + 1;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

exports.getStudentStatus = async (req, res) => {
    try {
        const statusReport = await responseService.getStudentStatus(
            req.params.studentId
        );

        res.json({
            success: true,
            data: statusReport
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
};