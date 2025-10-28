const mongoose = require('mongoose');
const Response = require('../models/response.model');
const { Question, Form } = require('../models/question.model');
const Student = require('../models/student.model');
const Class = require('../models/class.model');
// const Form = require('../mod els/form.model');

class ResponseService {

    async processFormResponse(studentId, formId, answers) {



        const student = await Student.findById(studentId).populate('class');
        // if (!student) throw new Error('Student not found');
        // if (!student.class) throw new Error('Student is not assigned to any class');

        const form = await Form.findById(formId);
        if (!form) throw new Error('Form not found');



        // Validate that the form subject matches the student's class subject

        // TODO: re-enable this check if forms are strictly tied to class subjects
        // if (form.subject !== student.class.Subject) {
        //     throw new Error('Form subject does not match student\'s class subject');
        // }

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


        // cheack of the student has submit form in this day or not

        const lastSubmet = await Response.findOne({ student: studentId })
            .sort({ timestamp: -1 });


        // TODO: re-enable this check if only one submission per day is allowed

        // if (lastSubmet) {
        //     const lastDate = new Date(lastSubmet.timestamp);
        //     const currentDate = new Date();
        //     console.log('Last submitted date:', lastDate);
        //     console.log('Current date:', currentDate);

        //     if (lastDate.toDateString() === currentDate.toDateString()) {
        //         throw new Error('Form already submitted today - only one submission per day allowed');
        //     }
        // }

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
                const selectedOption = question.options.find(opt => {
                    const optText = opt?.text ? String(opt.text).toLowerCase() : '';
                    const optName = opt?.name ? String(opt.name).toLowerCase() : '';
                    const answerLower = answer ? String(answer).toLowerCase() : '';
                    return optText === answerLower || optName === answerLower;
                });
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


    async getSchoolResponsesStatistics(schoolId, formDay, toDay) {
        // Step 1: Find all classes and students related to this school
        const classes = await Class.find({ school: schoolId }).select('_id');
        const classIds = classes.map(c => c._id);

        const students = await Student.find({ class: { $in: classIds } }).select('_id');
        const studentIds = students.map(s => s._id);

        if (formDay > toDay) {
            throw new Error('Invalid date range: "from" date must be earlier than "to" date');
        }

        // Step 2: Handle date range
        const start = new Date(formDay);
        const end = new Date(toDay);
        end.setHours(23, 59, 59, 999); // include entire end day

        // Previous period (same range length before the start date)
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - diffDays);
        const prevEnd = new Date(start);

        async function fetchResponses(rangeStart, rangeEnd) {
            // 1️⃣ Get the form that has subject = 'daily'
            const form = await Form.findOne({ subject: 'daily' });

            if (!form) {
                console.log('Form with subject "daily" not found');
                return [];
            }

            // 2️⃣ Extract all question IDs from that form
            const allQuestionIDs = form.questions.map(q => q._id);

            // 3️⃣ Fetch all responses in the date range that include these questions
            const responses = await Response.find({
                student: { $in: studentIds },
                'answers.question.id': { $in: allQuestionIDs },
                timestamp: { $gte: rangeStart, $lte: rangeEnd }
            })
                .populate('student', 'name')
                .populate('form', 'subject');

            console.log('responses:', responses);

            return responses;
        }



        const [currentResponses, previousResponses] = await Promise.all([
            fetchResponses(start, end),
            fetchResponses(prevStart, prevEnd)
        ]);

        // Step 4: Helper to build statistics
        function buildStatistics(responses) {
            const questionsMap = {};
            let totalResponses = responses.length;
            let totalSum = 0;
            let totalCount = 0;

            for (const response of responses) {
                for (const answer of response.answers) {
                    const qId = answer.question.id.toString();
                    if (!questionsMap[qId]) {
                        questionsMap[qId] = {
                            id: qId,
                            text: answer.question.text,
                            type: answer.question.type,
                            values: {},
                            average: 0
                        };
                    }

                    const val = answer.answer;
                    questionsMap[qId].values[val] = (questionsMap[qId].values[val] || 0) + 1;
                }
            }

            for (const q of Object.values(questionsMap)) {
                if (q.type === "slider") {
                    let sum = 0, count = 0;

                    for (const [val, freq] of Object.entries(q.values)) {
                        const num = parseFloat(val);
                        if (!isNaN(num)) {
                            sum += num * freq;
                            count += freq;
                        }
                    }

                    if (count > 0) {
                        q.average = parseFloat((sum / count).toFixed(2));
                        totalSum += sum;
                        totalCount += count;
                    } else {
                        q.average = getMostCommonAnswer(q.values);
                    }
                } else {
                    q.average = getMostCommonAnswer(q.values);
                }
            }

            const totalAverage =
                totalCount > 0 ? parseFloat((totalSum / totalCount).toFixed(2)) : 0;

            return {
                totalResponses,
                questions: Object.values(questionsMap),
                totalAverage
            };
        }

        // Step 5: Utility - most common answer
        function getMostCommonAnswer(values) {
            let maxFreq = 0;
            let mostCommon = "N/A";
            for (const [val, freq] of Object.entries(values)) {
                if (freq > maxFreq) {
                    maxFreq = freq;
                    mostCommon = val;
                }
            }
            return mostCommon;
        }

        // Step 6: Return final statistics
        return {
            currentRange: buildStatistics(currentResponses),
            previousRange: buildStatistics(previousResponses),
            dateRange: {
                from: formDay,
                to: toDay,
                previousFrom: prevStart.toISOString().split('T')[0],
                previousTo: prevEnd.toISOString().split('T')[0]
            }
        };
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