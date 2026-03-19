const responseService = require('../services/response.service');
const Response = require('../models/response.model');
const { generateAnalyticsReport, generateStudentsStatusReport, generateClassStudentsStatusReport, generateStudentCompareTwoDaysReport, generateSchoolExamSummaryReport, generateClassExamSummaryReport } = require('../services/report.service');
const School = require('../models/school.model');

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


/**
 * Compare a student's answers between two specific days.
 * Query params: day1=YYYY-MM-DD&day2=YYYY-MM-DD
 */
exports.getStudentStatusCompareTwoDays = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { day1, day2 } = req.query;


        if (!day1 || !day2) {
            return res.status(400).json({
                success: false,
                error: 'Both day1 and day2 query parameters are required (YYYY-MM-DD)'
            });
        }

        const result = await responseService.getStudentStatusCompareTwoDays(
            studentId,
            day1,
            day2
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(error.message === 'Student not found' ? 404 : 400).json({
            success: false,
            error: error.message
        });
    }
};


/**
 * Generate a PDF report comparing a student's answers between two specific days.
 * Query params: day1=YYYY-MM-DD&day2=YYYY-MM-DD
 */
exports.getStudentStatusCompareTwoDaysPDF = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { day1, day2 } = req.query;

        if (!day1 || !day2) {
            return res.status(400).json({
                success: false,
                error: 'Both day1 and day2 query parameters are required (YYYY-MM-DD)'
            });
        }

        // Fetch the comparison data
        const compareData = await responseService.getStudentStatusCompareTwoDays(
            studentId,
            day1,
            day2
        );



        // Generate the PDF
        const result = await generateStudentCompareTwoDaysReport({
            success: true,
            data: compareData
        });

        res.json({
            success: true,
            message: 'Student comparison report generated successfully',
            data: {
                fileName: result.fileName,
                fileType: result.fileType,
                downloadUrl: result.downloadUrl,
                generatedAt: new Date().toISOString()
            },
            compareData
        });
    } catch (error) {
        res.status(error.message === 'Student not found' ? 404 : 500).json({
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
        const note = req.body?.note || null;
        const school = await School.findById(schoolId);
        if (!school) {
            return res.status(404).json({ success: false, error: 'School not found' });
        }
        const statistics = await responseService.getDailySchoolResponsesStatistics(schoolId, formDay, toDay);
        const result = await generateAnalyticsReport({
            success: true,
            data: {
                schoolName: school.schoolName,
                ...statistics
            }
        }, note);

        res.json({
            success: true,
            message: 'Daily statistics report generated successfully',
            data: {
                fileName: result.fileName,
                fileType: result.fileType,
                downloadUrl: result.downloadUrl,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


/**
 * Get all students status for a school
 * Returns school info, classes, and students with their response status (green, red, not_answered)
 */
exports.getSchoolStudentsStatus = async (req, res) => {
    try {
        const schoolId = req.params.id;

        const result = await responseService.getSchoolStudentsStatus(schoolId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(error.message === 'School not found' ? 404 : 500).json({
            success: false,
            error: error.message
        });
    }
};


/**
 * Get all students status for a school as PDF report
 * Generates a PDF report with school info, classes summary, and students with their status
 */
exports.getSchoolStudentsStatusPDF = async (req, res) => {
    try {
        const schoolId = req.params.id;
        const note = req.body?.note || null;

        // Get the students status data
        const statusData = await responseService.getSchoolStudentsStatus(schoolId);

        // Generate the PDF report
        const result = await generateStudentsStatusReport({
            success: true,
            data: statusData
        }, note);

        res.json({
            success: true,
            message: 'School students status report generated successfully',
            data: {
                fileName: result.fileName,
                fileType: result.fileType,
                downloadUrl: result.downloadUrl,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(error.message === 'School not found' ? 404 : 500).json({
            success: false,
            error: error.message
        });
    }
};


/**
 * Get all students status for a class as PDF report
 * Generates a PDF report with class info, school info, and students with their detailed status including questions and answers
 */
exports.getClassStudentsStatusPDF = async (req, res) => {
    try {
        const classId = req.params.id;
        const note = req.body?.note || null;

        // Get the class students status data with detailed answers
        const statusData = await responseService.getClassStudentsStatus(classId);

        // Generate the PDF report using the detailed class template
        const result = await generateClassStudentsStatusReport({
            success: true,
            data: statusData
        }, note);

        res.json({
            success: true,
            message: 'Class students status report generated successfully',
            data: {
                fileName: result.fileName,
                fileType: result.fileType,
                downloadUrl: result.downloadUrl,
                generatedAt: new Date().toISOString()
            },
            statusData: statusData
        });
    } catch (error) {
        res.status(error.message === 'Class not found' ? 404 : 500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get all students status for a single class
 * Returns school info, class info, and students with their detailed response status including questions and answers
 */
exports.getClassStudentsStatus = async (req, res) => {
    try {
        const classId = req.params.id;

        const result = await responseService.getClassStudentsStatus(classId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(error.message === 'Class not found' ? 404 : 500).json({
            success: false,
            error: error.message
        });
    }
};


/**
 * Get school exam summary as JSON
 * Returns per-question stats (answered count, distribution, averageStatus) for the whole school
 */
exports.getSchoolExamSummary = async (req, res) => {
    try {
        const schoolId = req.params.id;
        const result = await responseService.getSchoolExamSummary(schoolId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(error.message === 'School not found' ? 404 : 500).json({
            success: false,
            error: error.message
        });
    }
};


/**
 * Generate school exam summary as PDF
 */
exports.getSchoolExamSummaryPDF = async (req, res) => {
    try {
        const schoolId = req.params.id;
        const note = req.body?.note || null;

        const summaryData = await responseService.getSchoolExamSummary(schoolId);

        const result = await generateSchoolExamSummaryReport({ success: true, data: summaryData }, note);

        res.json({
            success: true,
            message: 'School exam summary report generated successfully',
            data: {
                fileName: result.fileName,
                fileType: result.fileType,
                downloadUrl: result.downloadUrl,
                generatedAt: new Date().toISOString()
            },
            summaryData
        });
    } catch (error) {
        res.status(error.message === 'School not found' ? 404 : 500).json({
            success: false,
            error: error.message
        });
    }
};


/**
 * Get class exam summary as JSON
 * Returns per-question stats for a single class
 */
exports.getClassExamSummary = async (req, res) => {
    try {
        const classId = req.params.id;
        const result = await responseService.getClassExamSummary(classId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(error.message === 'Class not found' ? 404 : 500).json({
            success: false,
            error: error.message
        });
    }
};


/**
 * Generate class exam summary as PDF
 */
exports.getClassExamSummaryPDF = async (req, res) => {
    try {
        const classId = req.params.id;
        const note = req.body?.note || null;

        const summaryData = await responseService.getClassExamSummary(classId);
        const result = await generateClassExamSummaryReport({ success: true, data: summaryData }, note);

        res.json({
            success: true,
            message: 'Class exam summary report generated successfully',
            data: {
                fileName: result.fileName,
                fileType: result.fileType,
                downloadUrl: result.downloadUrl,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(error.message === 'Class not found' ? 404 : 500).json({
            success: false,
            error: error.message
        });
    }
};