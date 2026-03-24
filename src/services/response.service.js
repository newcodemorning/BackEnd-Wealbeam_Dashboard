const mongoose = require('mongoose');
const Response = require('../models/response.model');
const { Question, Form } = require('../models/question.model');
const Student = require('../models/student.model');
const Class = require('../models/class.model');
const School = require('../models/school.model');
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


    /**
     * Compare a student's answers between two specific days.
     * Returns the same shape as getStudentStatus for each day separately.
     */
    async getStudentStatusCompareTwoDays(studentId, day1, day2) {
        const student = await Student.findById(studentId).populate('class');
        if (!student) throw new Error('Student not found');
        if (!student.class) throw new Error('Student is not assigned to any class');

        const questions = await Question.find({ subject: student.class.Subject })
            .sort({ order: 1 });

        const questionsFormatted = questions.map(q => ({
            id: q._id,
            text: q.text,
            type: q.type,
            options: q.options,
            order: q.order
        }));

        // Helper: fetch the responses for a single day (midnight → 23:59:59)
        const getDayResponses = async (dayStr) => {
            const start = new Date(dayStr);
            const end = new Date(dayStr);
            end.setHours(23, 59, 59, 999);

            if (isNaN(start.getTime())) {
                throw new Error(`Invalid date format for "${dayStr}". Use YYYY-MM-DD`);
            }

            const responses = await Response.find({
                student: studentId,
                timestamp: { $gte: start, $lte: end }
            }).sort({ timestamp: -1 });

            // Take the latest response of that day (same as student-status behaviour)
            const latest = responses[0] || null;

            return {
                date: dayStr,
                responded: !!latest,
                response: latest ? {
                    responseId: latest._id,
                    timestamp: latest.timestamp,
                    answers: latest.answers
                } : null
            };
        };

        const [result1, result2] = await Promise.all([
            getDayResponses(day1),
            getDayResponses(day2)
        ]);

        return {
            student: {
                id: student._id,
                name: `${student.first_name} ${student.last_name}`,
                subject: student.class.Subject
            },
            questions: questionsFormatted,
            day1: result1,
            day2: result2
        };
    }


    async getDailySchoolResponsesStatisticsDD(schoolId, fromDay, toDay) {

        /* -------------------- DATE SETUP -------------------- */
        const start = new Date(fromDay);
        const end = new Date(toDay);
        end.setHours(23, 59, 59, 999);

        const daysCount =
            Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        /* -------------------- STUDENTS -------------------- */
        const classes = await Class.find({ school: schoolId }).select('_id');
        const classIds = classes.map(c => c._id);

        const students = await Student.find({ class: { $in: classIds } })
            .select('_id first_name last_name class');

        const studentIds = students.map(s => s._id);

        /* -------------------- FORM -------------------- */
        const form = await Form.findOne({ subject: 'daily' });
        if (!form) throw new Error('Daily form not found');

        const questionMap = {};
        form.questions.forEach(q => {
            questionMap[q._id.toString()] = q;
        });

        /* -------------------- RESPONSES -------------------- */
        const responses = await Response.find({
            student: { $in: studentIds },
            form: form._id,
            timestamp: { $gte: start, $lte: end }
        }).populate('student');

        /* -------------------- HELPERS -------------------- */
        const getDayKey = d => d.toISOString().split('T')[0];

        const getStatusFromAverage = avg => {
            if (avg >= 4) return 'green';
            if (avg >= 2.5) return 'yellow';
            return 'red';
        };

        /* -------------------- DAILY OVERVIEW -------------------- */
        const dailyMap = {};

        responses.forEach(r => {
            const day = getDayKey(r.timestamp);

            if (!dailyMap[day]) {
                dailyMap[day] = {
                    totalSum: 0,
                    totalCount: 0,
                    responses: 0,
                    statusDistribution: { green: 0, yellow: 0, red: 0 }
                };
            }

            let studentSum = 0;
            let studentCount = 0;

            r.answers.forEach(a => {
                if (a.question.type === 'slider') {
                    const num = Number(a.answer);
                    if (!isNaN(num)) {
                        studentSum += num;
                        studentCount++;
                        dailyMap[day].totalSum += num;
                        dailyMap[day].totalCount++;
                    }
                }
            });

            if (studentCount > 0) {
                const avg = studentSum / studentCount;
                const status = getStatusFromAverage(avg);
                dailyMap[day].statusDistribution[status]++;
            }

            dailyMap[day].responses++;
        });

        const dailyOverview = Object.entries(dailyMap).map(([date, d]) => ({
            date,
            average: d.totalCount ? +(d.totalSum / d.totalCount).toFixed(2) : 0,
            responses: d.responses,
            statusDistribution: d.statusDistribution
        }));

        /* -------------------- SUMMARY -------------------- */
        const expectedResponses = students.length * daysCount;
        const actualResponses = responses.length;

        const totalSum = dailyOverview.reduce((a, d) => a + d.average, 0);
        const overallAverage =
            dailyOverview.length ? +(totalSum / dailyOverview.length).toFixed(2) : 0;

        const totalStatus = { green: 0, yellow: 0, red: 0 };
        dailyOverview.forEach(d => {
            totalStatus.green += d.statusDistribution.green;
            totalStatus.yellow += d.statusDistribution.yellow;
            totalStatus.red += d.statusDistribution.red;
        });

        const totalStatusCount =
            totalStatus.green + totalStatus.yellow + totalStatus.red;

        const riskRate = {
            green: Math.round((totalStatus.green / totalStatusCount) * 100),
            yellow: Math.round((totalStatus.yellow / totalStatusCount) * 100),
            red: Math.round((totalStatus.red / totalStatusCount) * 100)
        };

        /* -------------------- STUDENTS TIMELINE -------------------- */
        const studentMap = {};

        students.forEach(s => {
            studentMap[s._id] = {
                studentId: s._id,
                name: `${s.first_name} ${s.last_name}`,
                class: s.class,
                daysAnswered: 0,
                dailyStatus: []
            };
        });

        responses.forEach(r => {
            let sum = 0, count = 0;

            r.answers.forEach(a => {
                if (a.question.type === 'slider') {
                    const num = Number(a.answer);
                    if (!isNaN(num)) {
                        sum += num;
                        count++;
                    }
                }
            });

            if (count > 0) {
                const avg = +(sum / count).toFixed(2);
                studentMap[r.student._id].daysAnswered++;
                studentMap[r.student._id].dailyStatus.push({
                    date: getDayKey(r.timestamp),
                    average: avg,
                    status: getStatusFromAverage(avg)
                });
            }
        });

        const studentsTimeline = Object.values(studentMap).map(s => ({
            ...s,
            attendanceRate: Math.round((s.daysAnswered / daysCount) * 100)
        }));

        /* -------------------- FINAL RESPONSE -------------------- */
        return {
            meta: {
                schoolId,
                examType: 'daily',
                dateRange: { from: fromDay, to: toDay, daysCount },
                generatedAt: new Date()
            },
            summary: {
                studentsCount: students.length,
                expectedResponses,
                actualResponses,
                attendanceRate: Math.round((actualResponses / expectedResponses) * 100),
                overallAverage,
                riskRate
            },
            dailyOverview,
            // studentsTimeline
        };
    }


    async getDailySchoolResponsesStatistics(schoolId, formDay, toDay) {
        // 1️⃣ جلب كل الصفوف والطلاب
        const classes = await Class.find({ school: schoolId }).select('_id ClassName');
        const classIds = classes.map(c => c._id);

        const students = await Student.find({ class: { $in: classIds } }).select('_id name class');
        const studentIds = students.map(s => s._id);

        if (formDay > toDay) throw new Error('Invalid date range');

        const start = new Date(formDay);
        const end = new Date(toDay);
        end.setHours(23, 59, 59, 999);

        async function fetchResponses(rangeStart, rangeEnd) {
            const form = await Form.findOne({ subject: 'daily' });
            if (!form) return [];

            const questionIds = form.questions.map(q => q._id);

            const responses = await Response.find({
                student: { $in: studentIds },
                'answers.question.id': { $in: questionIds },
                timestamp: { $gte: rangeStart, $lte: rangeEnd }
            }).populate('student', 'name class');

            return responses;
        }

        const responses = await fetchResponses(start, end);

        // 2️⃣ احسب attendanceRate و actualResponses
        const actualResponses = responses.length;
        const expectedResponses = students.length * Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const attendanceRate = parseFloat(((actualResponses / expectedResponses) * 100).toFixed(2));

        // Get the form to access question details
        const form = await Form.findOne({ subject: 'daily' });
        const questionTextMap = {};
        if (form) {
            form.questions.forEach(q => {
                questionTextMap[q._id.toString()] = q.text;
            });
        }

        // 3️⃣ احسب riskRate لكل طالب بناءً على متوسط إجاباته
        const studentStatus = {}; // studentId => status
        const questionStats = {}; // لكل سؤال
        for (const response of responses) {
            let total = 0;
            let count = 0;

            for (const answer of response.answers) {
                const qId = answer.question.id.toString();
                if (!questionStats[qId]) questionStats[qId] = { type: answer.question.type, values: {} };
                questionStats[qId].values[answer.answer] = (questionStats[qId].values[answer.answer] || 0) + 1;

                if (answer.question.type === 'slider') {
                    total += parseFloat(answer.answer);
                    count++;
                }
            }

            let avg = count > 0 ? total / count : 0;
            if (avg >= 4) studentStatus[response.student._id] = 'green';
            else if (avg >= 2) studentStatus[response.student._id] = 'yellow';
            else studentStatus[response.student._id] = 'red';
        }

        // 4️⃣ احسب summary riskRate مع الأخذ في الحسبان الغائبين
        let green = 0, yellow = 0, red = 0, absent = 0;
        for (const student of students) {
            const status = studentStatus[student._id];
            if (!status) absent++;
            else if (status === 'green') green++;
            else if (status === 'yellow') yellow++;
            else if (status === 'red') red++;
        }

        const totalStudents = students.length;
        const riskRate = {
            green: parseFloat(((green / totalStudents) * 100).toFixed(2)),
            yellow: parseFloat(((yellow / totalStudents) * 100).toFixed(2)),
            red: parseFloat(((red / totalStudents) * 100).toFixed(2)),
            absent: parseFloat(((absent / totalStudents) * 100).toFixed(2))
        };

        // 5️⃣ احسب overallAverage لكل الاسئلة
        const overallAverage = (() => {
            let sum = 0, count = 0;
            for (const q of Object.values(questionStats)) {
                if (q.type === 'slider') {
                    for (const [val, freq] of Object.entries(q.values)) {
                        sum += parseFloat(val) * freq;
                        count += freq;
                    }
                }
            }
            return count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
        })();

        // 6️⃣ بناء تقرير questionsTrend
        const questionsTrend = Object.entries(questionStats).map(([qId, q]) => {
            let sum = 0, count = 0;
            for (const [val, freq] of Object.entries(q.values)) {
                if (q.type === 'slider') {
                    sum += parseFloat(val) * freq;
                    count += freq;
                }
            }
            return {
                questionId: qId,
                text: questionTextMap[qId] || { en: 'Unknown', ar: 'غير معروف' },
                type: q.type,
                distribution: q.values,
                overallAverage: count > 0 ? parseFloat((sum / count).toFixed(2)) : 0
            };
        });

        // 7️⃣ بناء تقرير classesOverview
        const classNameMap = {};
        classes.forEach(c => {
            classNameMap[c._id.toString()] = c.ClassName;
        });

        const classesOverview = classes.map(c => {
            const clsStudents = students.filter(s => s.class.equals(c._id));
            let sum = 0, count = 0;
            let clsRisk = 0;

            for (const s of clsStudents) {
                const status = studentStatus[s._id];
                if (!status) clsRisk++;
                else if (status === 'red') clsRisk++;
                if (responses.find(r => r.student._id.equals(s._id))) {
                    const r = responses.filter(r => r.student._id.equals(s._id))[0];
                    let total = 0, cnt = 0;
                    for (const a of r.answers) {
                        if (a.question.type === 'slider') {
                            total += parseFloat(a.answer);
                            cnt++;
                        }
                    }
                    if (cnt > 0) {
                        sum += total / cnt;
                        count++;
                    }
                }
            }

            return {
                classId: c._id,
                className: c.ClassName,
                studentsCount: clsStudents.length,
                average: count > 0 ? parseFloat((sum / count).toFixed(2)) : 0,
                riskRate: clsRisk,
                status: clsRisk > clsStudents.length / 2 ? 'red' : 'green'
            };
        });

        // 8️⃣ بناء تقرير riskAlerts
        const riskAlerts = students.filter(s => studentStatus[s._id] === 'red').map(s => ({
            level: 'high',
            studentId: s._id,
            studentName: s.name,
            reason: 'Low average or absent',
            lastDetected: new Date()
        }));

        // 9️⃣ dailyOverview
        const dailyOverview = [];
        const daysCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        for (let d = 0; d < daysCount; d++) {
            const day = new Date(start);
            day.setDate(day.getDate() + d);
            const dayStr = day.toISOString().split('T')[0];
            const dayResponses = responses.filter(r => r.timestamp.toISOString().startsWith(dayStr));
            let sum = 0, cnt = 0;
            const statusDist = { green: 0, yellow: 0, red: 0 };
            for (const r of dayResponses) {
                let total = 0, c = 0;
                for (const a of r.answers) {
                    if (a.question.type === 'slider') {
                        total += parseFloat(a.answer);
                        c++;
                    }
                }
                if (c > 0) {
                    const avg = total / c;
                    if (avg >= 4) statusDist.green++;
                    else if (avg >= 2) statusDist.yellow++;
                    else statusDist.red++;
                    sum += avg;
                    cnt++;
                }
            }
            dailyOverview.push({
                date: dayStr,
                average: cnt > 0 ? parseFloat((sum / cnt).toFixed(2)) : 0,
                responses: dayResponses.length,
                statusDistribution: statusDist
            });
        }

        return {
            meta: {
                schoolId,
                examType: 'daily',
                dateRange: {
                    from: formDay,
                    to: toDay,
                    daysCount
                },
                generatedAt: new Date().toISOString()
            },
            summary: {
                studentsCount: students.length,
                expectedResponses,
                actualResponses,
                attendanceRate,
                overallAverage,
                riskRate
            },
            dailyOverview,
            questionsTrend,
            classesOverview,
            riskAlerts
        };
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

    /**
     * Get all students status for a school with detailed information
     * Returns school info, classes, and students with their response status
     * @param {string} schoolId - The school ID
     * @returns {Object} School data with classes and students status
     */
    async getSchoolStudentsStatus(schoolId) {
        // Get school with user info for email
        const school = await require('../models/school.model').findById(schoolId)
            .populate('user', 'email')
            .populate('teachers');

        if (!school) throw new Error('School not found');

        // Get all classes for the school
        const classes = await Class.find({ school: schoolId })
            .populate('teacher', 'first_name last_name')
            .select('_id ClassName Subject SelectDate teacher');

        const classIds = classes.map(c => c._id);

        // Get all students in these classes
        const students = await Student.find({ class: { $in: classIds } })
            .populate('user', 'email')
            .select('_id first_name last_name class user photo gender date_of_birth');

        const studentIds = students.map(s => s._id);

        // Get the latest response for each student
        const latestResponses = await Response.aggregate([
            {
                $match: {
                    student: { $in: studentIds }
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: '$student',
                    latestResponse: { $first: '$$ROOT' }
                }
            }
        ]);

        // Create a map of student responses
        const responseMap = {};
        latestResponses.forEach(r => {
            responseMap[r._id.toString()] = r.latestResponse;
        });

        // Determine student status based on their last response
        const getStudentStatus = (studentId) => {
            const response = responseMap[studentId.toString()];

            if (!response) {
                return {
                    status: 'not_answered',
                    lastResponseDate: null,
                    answers: []
                };
            }

            // Calculate overall status from answers
            const answers = response.answers || [];
            let hasRed = false;
            let hasYellow = false;

            answers.forEach(a => {
                if (a.status === 'red') hasRed = true;
                else if (a.status === 'yellow') hasYellow = true;
            });

            let overallStatus = 'green';
            if (hasRed) overallStatus = 'red';
            else if (hasYellow) overallStatus = 'yellow';

            return {
                status: overallStatus,
                lastResponseDate: response.timestamp,
                answersCount: answers.length
            };
        };

        // Build students array for each class
        const classStudentsMap = {};
        classes.forEach(c => {
            classStudentsMap[c._id.toString()] = [];
        });

        students.forEach(student => {
            const classId = student.class?.toString();
            if (classId && classStudentsMap[classId]) {
                const statusInfo = getStudentStatus(student._id);
                classStudentsMap[classId].push({
                    id: student._id,
                    name: `${student.first_name} ${student.last_name}`,
                    email: student.user?.email || null,
                    photo: student.photo || null,
                    gender: student.gender,
                    dateOfBirth: student.date_of_birth,
                    status: statusInfo.status,
                    lastResponseDate: statusInfo.lastResponseDate,
                    answersCount: statusInfo.answersCount || 0
                });
            }
        });

        // Build classes array with students
        const classesData = classes.map(cls => {
            const classStudents = classStudentsMap[cls._id.toString()] || [];

            // Count status distribution
            const statusCounts = {
                green: 0,
                yellow: 0,
                red: 0,
                not_answered: 0
            };

            classStudents.forEach(s => {
                statusCounts[s.status]++;
            });

            return {
                id: cls._id,
                className: cls.ClassName,
                subject: cls.Subject,
                selectDate: cls.SelectDate,
                teacher: cls.teacher ? {
                    id: cls.teacher._id,
                    name: `${cls.teacher.first_name} ${cls.teacher.last_name}`
                } : null,
                studentsCount: classStudents.length,
                statusDistribution: statusCounts,
                students: classStudents
            };
        });

        // Calculate school-level statistics
        const totalStudents = students.length;
        const totalClasses = classes.length;

        const schoolStatusCounts = {
            green: 0,
            yellow: 0,
            red: 0,
            not_answered: 0
        };

        classesData.forEach(cls => {
            schoolStatusCounts.green += cls.statusDistribution.green;
            schoolStatusCounts.yellow += cls.statusDistribution.yellow;
            schoolStatusCounts.red += cls.statusDistribution.red;
            schoolStatusCounts.not_answered += cls.statusDistribution.not_answered;
        });

        return {
            school: {
                id: school._id,
                name: school.schoolName,
                email: school.user?.email || null,
                address: school.address,
                phone: school.phone,
                language: school.language,
                subscriptionEndDate: school.subscriptionEndDate,
                teachersCount: school.teachers?.length || 0
            },
            statistics: {
                totalStudents,
                totalClasses,
                statusDistribution: schoolStatusCounts,
                statusPercentage: {
                    green: totalStudents > 0 ? parseFloat(((schoolStatusCounts.green / totalStudents) * 100).toFixed(2)) : 0,
                    yellow: totalStudents > 0 ? parseFloat(((schoolStatusCounts.yellow / totalStudents) * 100).toFixed(2)) : 0,
                    red: totalStudents > 0 ? parseFloat(((schoolStatusCounts.red / totalStudents) * 100).toFixed(2)) : 0,
                    not_answered: totalStudents > 0 ? parseFloat(((schoolStatusCounts.not_answered / totalStudents) * 100).toFixed(2)) : 0
                }
            },
            classes: classesData,
            generatedAt: new Date().toISOString()
        };
    }


    /**
     * Get all students status for a single class by class ID
     * Returns school info, class info, and students with their detailed response status including questions and answers
     */
    async getClassStudentsStatus(classId) {
        // Get the class with teacher info
        const classData = await Class.findById(classId)
            .populate('teacher', 'first_name last_name')
            .populate('school');

        if (!classData) throw new Error('Class not found');

        // Get the school with user info
        const school = await require('../models/school.model').findById(classData.school._id)
            .populate('user', 'email')
            .populate('teachers');

        if (!school) throw new Error('School not found');

        // Get all questions for the daily form (like getStudentStatus)
        const { Form } = require('../models/question.model');
        const form = await Form.findOne({ subject: 'daily' });
        const questions = form ? form.questions : [];

        // Get all students in this class
        const students = await Student.find({ class: classId })
            .populate('user', 'email')
            .select('_id first_name last_name class user photo gender date_of_birth');

        const studentIds = students.map(s => s._id);

        // Get the latest response for each student
        const latestResponses = await Response.aggregate([
            {
                $match: {
                    student: { $in: studentIds }
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: '$student',
                    latestResponse: { $first: '$$ROOT' }
                }
            }
        ]);

        // Create a map of student responses
        const responseMap = {};
        latestResponses.forEach(r => {
            responseMap[r._id.toString()] = r.latestResponse;
        });

        // Determine student status based on their last response - with detailed answers
        const getStudentStatusDetailed = (studentId) => {
            const response = responseMap[studentId.toString()];

            if (!response) {
                return {
                    status: 'not_answered',
                    lastResponseDate: null,
                    answersCount: 0,
                    answers: []
                };
            }

            // Calculate overall status from answers
            const answers = response.answers || [];
            let hasRed = false;
            let hasYellow = false;

            answers.forEach(a => {
                if (a.status === 'red') hasRed = true;
                else if (a.status === 'yellow') hasYellow = true;
            });

            let overallStatus = 'green';
            if (hasRed) overallStatus = 'red';
            else if (hasYellow) overallStatus = 'yellow';

            return {
                status: overallStatus,
                lastResponseDate: response.timestamp,
                answersCount: answers.length,
                answers: answers.map(a => ({
                    questionId: a.question?.id,
                    questionText: a.question?.text,
                    questionType: a.question?.type,
                    answer: a.answer,
                    status: a.status,
                    trend: a.trend
                }))
            };
        };

        // Build students array for the class with detailed data
        const classStudents = [];
        const statusCounts = {
            green: 0,
            yellow: 0,
            red: 0,
            not_answered: 0
        };

        students.forEach(student => {
            const statusInfo = getStudentStatusDetailed(student._id);
            statusCounts[statusInfo.status]++;
            classStudents.push({
                id: student._id,
                name: `${student.first_name} ${student.last_name}`,
                firstName: student.first_name,
                lastName: student.last_name,
                email: student.user?.email || null,
                photo: student.photo || null,
                gender: student.gender,
                dateOfBirth: student.date_of_birth,
                status: statusInfo.status,
                lastResponseDate: statusInfo.lastResponseDate,
                answersCount: statusInfo.answersCount || 0,
                answers: statusInfo.answers || []
            });
        });

        // Build class data
        const classInfo = {
            id: classData._id,
            className: classData.ClassName,
            subject: classData.Subject,
            selectDate: classData.SelectDate,
            teacher: classData.teacher ? {
                id: classData.teacher._id,
                name: `${classData.teacher.first_name} ${classData.teacher.last_name}`
            } : null,
            studentsCount: classStudents.length,
            statusDistribution: statusCounts,
            students: classStudents
        };

        const totalStudents = students.length;

        return {
            school: {
                id: school._id,
                name: school.schoolName,
                email: school.user?.email || null,
                address: school.address,
                phone: school.phone,
                language: school.language,
                subscriptionEndDate: school.subscriptionEndDate,
                teachersCount: school.teachers?.length || 0
            },
            statistics: {
                totalStudents,
                totalClasses: 1,
                statusDistribution: statusCounts,
                statusPercentage: {
                    green: totalStudents > 0 ? parseFloat(((statusCounts.green / totalStudents) * 100).toFixed(2)) : 0,
                    yellow: totalStudents > 0 ? parseFloat(((statusCounts.yellow / totalStudents) * 100).toFixed(2)) : 0,
                    red: totalStudents > 0 ? parseFloat(((statusCounts.red / totalStudents) * 100).toFixed(2)) : 0,
                    not_answered: totalStudents > 0 ? parseFloat(((statusCounts.not_answered / totalStudents) * 100).toFixed(2)) : 0
                }
            },
            questions: questions.map(q => ({
                id: q._id,
                text: q.text,
                type: q.type,
                options: q.options,
                order: q.order
            })),
            classes: [classInfo],
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Get exam question summary for a whole school.
     * For each question in the daily form, returns: answered count,
     * answer distribution, per-status counts, and averageStatus (green/yellow/red).
     */
    async getSchoolExamSummary(schoolId) {
        const school = await School.findById(schoolId)
            .populate('user', 'email')
            .populate('teachers');
        if (!school) throw new Error('School not found');

        const classes = await Class.find({ school: schoolId })
            .populate('teacher', 'first_name last_name')
            .select('_id ClassName Subject SelectDate teacher');

        const classIds = classes.map(c => c._id);
        const students = await Student.find({ class: { $in: classIds } })
            .select('_id first_name last_name class');
        const studentIds = students.map(s => s._id);
        const totalStudents = students.length;

        // 1. Find daily form to exclude it
        const dailyForm = await Form.findOne({ subject: 'daily' });
        const dailyFormId = dailyForm ? dailyForm._id : null;

        // 2. Find all non-daily forms (exams)
        const examForms = await Form.find({ _id: { $ne: dailyFormId } });
        
        // Collect all unique questions from these forms
        const questionMap = {};
        examForms.forEach(f => {
            if (f.questions) {
                f.questions.forEach(q => {
                    questionMap[q._id.toString()] = q;
                });
            }
        });
        const questions = Object.values(questionMap);

        // 3. Get ALL responses for these students that are NOT daily forms
        const allExamResponses = await Response.find({
            student: { $in: studentIds },
            form: { $ne: dailyFormId }
        });

        const answeredStudentIds = new Set(allExamResponses.map(r => r.student.toString()));
        const answeredCount = answeredStudentIds.size;
        const notAnsweredCount = totalStudents - answeredCount;

        // 4. Per-question aggregation across ALL exam responses
        const questionStats = this._aggregateExamQuestionStats(questions, allExamResponses, studentIds);

        return {
            school: {
                id: school._id,
                name: school.schoolName,
                email: school.user?.email || null,
                address: school.address,
                phone: school.phone,
                language: school.language,
                subscriptionEndDate: school.subscriptionEndDate,
                teachersCount: school.teachers?.length || 0
            },
            statistics: {
                totalStudents,
                answeredCount, // unique students who took at least one exam
                notAnsweredCount,
                totalExamsTaken: allExamResponses.length
            },
            questions: questionStats,
            generatedAt: new Date().toISOString()
        };
    }


    /**
     * Get exam question summary for a single class.
     * Same shape as getSchoolExamSummary but scoped to one class.
     */
    async getClassExamSummary(classId) {
        const classData = await Class.findById(classId)
            .populate('teacher', 'first_name last_name')
            .populate('school');
        if (!classData) throw new Error('Class not found');

        const school = await School.findById(classData.school._id)
            .populate('user', 'email')
            .populate('teachers');
        if (!school) throw new Error('School not found');

        // 1. Find daily form to exclude it
        const dailyForm = await Form.findOne({ subject: 'daily' });
        const dailyFormId = dailyForm ? dailyForm._id : null;

        // 2. Find all non-daily forms (exams)
        const examForms = await Form.find({ _id: { $ne: dailyFormId } });
        
        // Collect all unique questions from these forms
        const questionMap = {};
        examForms.forEach(f => {
            if (f.questions) {
                f.questions.forEach(q => {
                    questionMap[q._id.toString()] = q;
                });
            }
        });
        const questions = Object.values(questionMap);

        const students = await Student.find({ class: classId })
            .select('_id first_name last_name class');
        const studentIds = students.map(s => s._id);
        const totalStudents = students.length;

        // 3. Get ALL responses for these students that are NOT daily forms
        const allExamResponses = await Response.find({
            student: { $in: studentIds },
            form: { $ne: dailyFormId }
        });

        const answeredStudentIds = new Set(allExamResponses.map(r => r.student.toString()));
        const answeredCount = answeredStudentIds.size;
        const notAnsweredCount = totalStudents - answeredCount;

        // 4. Per-question aggregation across ALL exam responses
        const questionStats = this._aggregateExamQuestionStats(questions, allExamResponses, studentIds);

        return {
            school: {
                id: school._id,
                name: school.schoolName,
                email: school.user?.email || null,
                address: school.address,
                phone: school.phone,
                language: school.language,
                subscriptionEndDate: school.subscriptionEndDate,
                teachersCount: school.teachers?.length || 0
            },
            class: {
                id: classData._id,
                className: classData.ClassName,
                subject: classData.Subject,
                selectDate: classData.SelectDate,
                teacher: classData.teacher ? {
                    id: classData.teacher._id,
                    name: `${classData.teacher.first_name} ${classData.teacher.last_name}`
                } : null
            },
            statistics: {
                totalStudents,
                answeredCount,
                notAnsweredCount,
                totalExamsTaken: allExamResponses.length
            },
            questions: questionStats,
            generatedAt: new Date().toISOString()
        };
    }


    /**
     * Internal helper: aggregates per-question stats from all exam responses.
     * @param {Array} questions - Unique exam question definitions
     * @param {Array} responses - All exam response documents
     * @param {Array} studentIds - All student IDs in scope
     */
    _aggregateExamQuestionStats(questions, responses, studentIds) {
        const totalStudents = studentIds.length;

        return questions.map(q => {
            const qIdStr = q._id.toString();
            let totalAnswers = 0;
            const distribution = {};
            const statusCounts = { green: 0, yellow: 0, red: 0 };
            const studentIdsWhoAnswered = new Set();

            responses.forEach(resp => {
                const answers = resp.answers || [];
                const match = answers.find(a => a.question?.id?.toString() === qIdStr);
                if (!match) return;

                totalAnswers++;
                studentIdsWhoAnswered.add(resp.student.toString());
                
                const answerVal = match.answer != null ? String(match.answer) : 'N/A';
                distribution[answerVal] = (distribution[answerVal] || 0) + 1;

                const s = match.status || 'green';
                if (s === 'green') statusCounts.green++;
                else if (s === 'yellow') statusCounts.yellow++;
                else if (s === 'red') statusCounts.red++;
            });

            // Dominant status calculation based on all historical answers for this question
            let averageStatus = 'green';
            if (statusCounts.red > 0 && statusCounts.red >= statusCounts.green && statusCounts.red >= statusCounts.yellow) {
                averageStatus = 'red';
            } else if (statusCounts.yellow > 0 && statusCounts.yellow >= statusCounts.green) {
                averageStatus = 'yellow';
            }

            const questionText = typeof q.text === 'object'
                ? (q.text.en || q.text.ar || JSON.stringify(q.text))
                : (q.text || 'Unknown');

            return {
                id: q._id,
                text: questionText,
                type: q.type,
                answeredCount: totalAnswers,
                uniqueStudentsCount: studentIdsWhoAnswered.size,
                notAnsweredCount: totalStudents - studentIdsWhoAnswered.size,
                distribution,
                statusCounts,
                averageStatus
            };
        });
    }
}

module.exports = new ResponseService();