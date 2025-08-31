const csv = require('fast-csv');
const fs = require('fs');
const { pipeline } = require('stream/promises');
const Student = require('../models/student.model');
const User = require('../models/user.model');
const Class = require('../models/class.model');
const Parent = require('../models/parent.model');
const path = require('path');
const { createStudentForImporting } = require('./student.service');
const School = require('../models/school.model');

// CSV Structure (example headers):
// first_name,last_name,second_email,photo,first_phone,second_phone,date_of_birth,gender,grade,user_email,class_name,parent_phone

// Import from CSV
async function importStudentsFromCSV(filePath) {
    const results = [];
    const errors = [];

    await pipeline(
        fs.createReadStream(filePath),
        csv.parse({ headers: true }),
        new (require('stream').Transform)({
            objectMode: true,
            transform: async (row, encoding, callback) => {
                try {
                    // 1. Find related entities
                    const trimmedClassName = row.class_name.trim().replace(/\s+/g, ' '); // Trim and normalize spaces
                    const [classObj, parent] = await Promise.all([
                        Class.findOne({ 
                            $expr: {
                                $eq: [
                                    { $trim: { input: "$ClassName" } }, // Trim spaces from stored class name
                                    trimmedClassName
                                ]
                            }
                        }).populate('school', '_id'),
                        Parent.findOne({ first_phone: row.parent_phone }),
                    ]);

                    if (!classObj) {
                        throw new Error(`Class "${trimmedClassName}" not found`);
                    }

                    if (!classObj.school) {
                        throw new Error(`Class "${trimmedClassName}" is not associated with any school`);
                    }

                    // 2. Prepare student data
                    const studentData = {
                        first_email: row.first_email,
                        first_phone: row.first_phone,
                        classId: classObj._id,
                        parentId: parent._id || null,
                        first_name: row.first_name,
                        last_name: row.last_name,
                        second_email: row.second_email,
                        second_phone: row.second_phone,
                        date_of_birth: new Date(row.date_of_birth),
                        gender: row.gender,
                        grade: row.grade,
                        photo: row.photo || "",
                        school: classObj.school._id 
                    };

                    // 3. Use service function
                    const student = await createStudentForImporting(studentData);
                    results.push(student);
                    callback();
                } catch (error) {
                    console.error(`Error on row : `, row);
                    console.error('Error details:', error);
                    errors.push({ row, error: error.message });
                    callback();
                }
            }
        })
    );

    return { results, errors };
}


// Export to CSV
async function exportStudentsToCSV(filePath) {
    // Create exports directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const students = await Student.find()
        .populate({
            path: 'user',
            select: 'email',
            model: User // Explicit model reference
        })
        .populate({
            path: 'class',
            select: 'ClassName',
            model: Class
        })
        .populate({
            path: 'parent',
            select: 'first_phone',
            model: Parent
        });

    return new Promise((resolve, reject) => {
        const csvStream = csv.format({ headers: true });
        const writableStream = fs.createWriteStream(filePath);

        csvStream.pipe(writableStream);

        students.forEach((student) => {
            csvStream.write({
                first_email: student.user?.email || '',
                first_name: student.first_name,
                last_name: student.last_name,
                second_email: student.second_email,
                photo: student.photo,
                first_phone: student.first_phone,
                second_phone: student.second_phone,
                date_of_birth: student.date_of_birth
                    ? new Date(student.date_of_birth).toISOString().split('T')[0]
                    : 'N/A',
                gender: student.gender,
                grade: student.grade,
                class_name: student.class?.ClassName || '',
                parent_phone: student.parent?.first_phone || ''
            });
        });

        csvStream.end();
        // Inside exportStudentsToCSV
        console.log(`Exporting ${students.length} students to ${filePath}`);
        students.forEach((student, index) => {
            console.log(`Writing student ${index + 1}:`, student._id);
        });

        writableStream.on('finish', resolve);
        writableStream.on('error', reject);
    });
}

module.exports = {
    importStudentsFromCSV,
    exportStudentsToCSV
};