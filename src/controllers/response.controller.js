const responseService = require('../services/response.service');
const Response = require('../models/response.model');
const { generateAnalyticsReport } = require('../services/report.service');

exports.submitFormResponse = async (req, res) => {
    try {
        const { form, answers } = req.body;

        const studentId = req.user.roleId;

        const lastSubmitted = await Response.findOne({ student: studentId }).sort({ timestamp: -1 });
        console.log("Last submitted:", lastSubmitted);
        // TODO : uncoomment this block to enforce daily submission limit

        // if (lastSubmitted) {
        //     const lastDate = new Date(lastSubmitted.timestamp);
        //     const today = new Date();
        //     console.log("Last submitted:", lastSubmitted);
        //     console.log("Last today:", today);
        //     if (lastDate.toDateString() === today.toDateString()) {
        //         console.log("Daily form already submitted today:", lastSubmitted.timestamp);
        //         return res.status(208).json(
        //             {
        //                 success: false,
        //                 status: 208,
        //                 message: 'Daily form already submitted today, wait until tomorrow to submit again',
        //                 lastSubmitted: lastSubmitted.timestamp,
        //             }
        //         );
        //     }
        // }








        if (!Array.isArray(answers) || !answers.length) {
            throw new Error('Answers must be a non-empty array');
        }

        const response = await responseService.processFormResponse(studentId, form, answers);

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


exports.getSchoolResponsesStatistics = async (req, res) => {
    try {
        const schoolId = req.params.id;
        const today = new Date();

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 7);

        const formDay = req.query.fromDay || yesterday.toISOString().split('T')[0];
        const toDay = req.query.toDay || today.toISOString().split('T')[0];
        const statistics = await responseService.getSchoolResponsesStatistics(schoolId, formDay, toDay);

        res.json({
            success: true,
            data: statistics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}; 



exports.getSchoolResponsesStatisticsDaily = async (req, res) => {
    try {
        const schoolId = req.params.id;
        const today = new Date();

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 7);

        const formDay = req.query.fromDay || yesterday.toISOString().split('T')[0];
        const toDay = req.query.toDay || today.toISOString().split('T')[0];
        const statistics = await responseService.getDailySchoolResponsesStatistics(schoolId, formDay, toDay);

        res.json({
            success: true,
            data: statistics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};



exports.getSchoolResponsesStatisticsDailyPDF = async (req, res) => {
    try {
        const schoolId = req.params.id;
        const today = new Date();

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 7);

        const formDay = req.query.fromDay || yesterday.toISOString().split('T')[0];
        const toDay = req.query.toDay || today.toISOString().split('T')[0];
        const statistics = await responseService.getDailySchoolResponsesStatistics(schoolId, formDay, toDay);
        const result = await generateAnalyticsReport({
            success: true,
            data: statistics
        });


        res.json({
            success: true,
            data: result,

        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};