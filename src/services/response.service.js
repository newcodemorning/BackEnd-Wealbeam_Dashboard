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
}

module.exports = new ResponseService();