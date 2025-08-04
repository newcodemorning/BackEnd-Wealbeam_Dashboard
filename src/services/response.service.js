const mongoose = require('mongoose');
const Response = require('../models/response.model');
const { Question, Form } = require('../models/question.model');
const Student = require('../models/student.model');
const Class = require('../models/class.model');

class ResponseService {
    async processFormResponse(studentId, formId, answers) {
        const student = await Student.findById(studentId).populate('class');
        if (!student) throw new Error('Student not found');
        if (!student.class) throw new Error('Student is not assigned to any class');

        const form = await Form.findById(formId);
        if (!form) throw new Error('Form not found');

        // Validate that the form subject matches the student's class subject
        if (form.subject !== student.class.Subject) {
            throw new Error('Form subject does not match student\'s class subject');
        }

        // Create question map for validation
        const questionMap = form.questions.reduce((acc, q) => {
            acc[q._id.toString()] = q;
            return acc;
        }, {});

        // Process all answers
        const processedAnswers = await Promise.all(
            answers.map(async (answerObj) => {
                // Validate question object structure
                if (!answerObj.question || !answerObj.question.id) {
                    throw new Error('Invalid question format: missing question ID');
                }

                const questionId = answerObj.question.id.toString();
                const question = questionMap[questionId];
                if (!question) throw new Error(`Invalid question ID: ${questionId}`);

                // Validate that the question type matches
                if (question.type !== answerObj.question.type) {
                    throw new Error(`Question type mismatch for question ${questionId}`);
                }

                return {
                    question: {
                        id: question._id,
                        text: question.text,
                        type: question.type
                    },
                    answer: answerObj.answer,
                    status: this.calculateStatus(question, answerObj.answer),
                    trend: question.type === 'slider' ? await this.calculateTrend(studentId, question._id, answerObj.answer) : null
                };
            })
        );

        return Response.create({
            student: studentId,
            form: formId,
            answers: processedAnswers
        });
    }

    calculateStatus(question, answer) {
        switch (question.type) {
            case 'slider':
                return this.handleSlider(answer);
            case 'yesno':
                const normalizedAnswer = answer.toLowerCase();
                const normalizedDanger = question.dangerAnswer?.toLowerCase() || '';
                return normalizedAnswer === normalizedDanger ? 'red' : 'green';
            case 'dropdown':
            case 'radiobutton':
                const selectedOption = question.options.find(opt =>
                    opt.text.toLowerCase() === answer.toLowerCase() || 
                    opt.name.toLowerCase() === answer.toLowerCase()
                );
                return selectedOption?.isDanger ? 'red' : 'green';
            default:
                return 'green';
        }
    }

    handleSlider(answer) {
        const numericAnswer = parseInt(answer);
        if (numericAnswer <= 6) return 'green';
        if (numericAnswer <= 7) return 'yellow';
        return 'red';
    }

    async calculateTrend(studentId, questionId, currentAnswer) {
        const previous = await Response.aggregate([
            {
                $match: {
                    student: new mongoose.Types.ObjectId(studentId),
                }
            },
            { $unwind: '$answers' },
            {
                $match: {
                    'answers.question.id': new mongoose.Types.ObjectId(questionId)
                }
            },
            { $sort: { 'timestamp': -1 } },
            { $limit: 1 }
        ]);

        if (!previous.length) return 'stable';

        const prevAnswer = previous[0].answers.answer;
        const prevValue = parseInt(prevAnswer);
        const currValue = parseInt(currentAnswer);

        if (!isNaN(prevValue) && !isNaN(currValue)) {
            if (currValue > prevValue) return 'worsening';
            if (currValue < prevValue) return 'improving';
        }

        return prevAnswer === currentAnswer ? 'stable' : 'changed';
    }

    async getStudentStatus(studentId) {
        const student = await Student.findById(studentId).populate('class');
        if (!student) throw new Error('Student not found');
        if (!student.class) throw new Error('Student is not assigned to any class');

        // Get all questions for the subject
        const questions = await Question.find({ subject: student.class.Subject })
            .sort({ order: 1 });

        // Get latest response
        const latestResponse = await Response.findOne({ student: studentId })
            .sort({ timestamp: -1 });

        const statusReport = {
            student: student._id,
            subject: student.class.Subject,
            questions: questions.map(q => ({
                id: q._id,
                text: q.text,
                type: q.type,
                options: q.options,
                order: q.order
            })),
            lastResponse: latestResponse ? {
                timestamp: latestResponse.timestamp,
                answers: latestResponse.answers
            } : null
        };

        return statusReport;
    }

    getStatusColor(score) {
        if (score <= 6) return 'green';
        if (score <= 8) return 'yellow';
        return 'red';
    }

    getStatusPriority(status) {
        const priorities = { red: 3, yellow: 2, green: 1 };
        return priorities[status] || 0;
    }
}

module.exports = new ResponseService();