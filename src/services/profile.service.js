const School = require('../models/school.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const User = require('../models/user.model');
const SuperAdmin = require('../models/super-admin.model');
const Incident = require('../models/incident.model');
const Class = require('../models/class.model');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');


class ProfileService {
    async getSchoolProfile(schoolId) {
        const school = await School.findById(schoolId)
            .populate({
                path: 'teachers',
                select: 'first_name last_name email photo title',
                populate: {
                    path: 'classes',
                    select: 'ClassName Subject'
                }
            })
            .populate({
                path: 'classes',
                select: 'ClassName Subject SelectDate',
                populate: {
                    path: 'teacher',
                    select: 'first_name last_name',
                    model: 'Teacher'
                }
            });

        if (!school) {
            throw new Error('School not found');
        }

        return {
            schoolId: school._id,
            
            schoolName: school.schoolName,
            address: school.address,
            phone: school.phone,
            subscriptionEndDate: school.subscriptionEndDate,
            language: school.language,
            teachers: school.teachers,
            classes: school.classes,
            totalTeachers: school.teachers.length,
            totalClasses: school.classes.length
        };
    }

    async getTeacherProfile(teacherId) {
        const teacher = await Teacher.findById(teacherId)
            // .populate({
            //     path: 'school',
            //     select: 'schoolName'
            // })
            // .populate({
            //     path: 'classes',
            //     select: 'ClassName Subject SelectDate',
            //     populate: {
            //         path: 'students',
            //         select: 'first_name last_name photo',
            //         model: 'Student'
            //     }
            // })
            .populate({
                path: 'user',
                select: 'email'
            });

        if (!teacher) {
            throw new Error('Teacher not found');
        }

        // Get recent incidents for teacher's classes
        const classIds = teacher.classes.map(c => c._id);
        const recentIncidents = await Incident.find({
            'student.class': { $in: classIds }
        })
            .sort({ dateTime: -1 })
            .limit(5)
            .populate({
                path: 'student',
                select: 'first_name last_name',
                populate: {
                    path: 'class',
                    select: 'ClassName'
                }
            });
        

        const allClasses = await Class.find({ teacher: teacher._id })
            .populate('students', 'first_name last_name photo');
            

        return {
            id: teacher._id,
            first_name: teacher.first_name,
            last_name: teacher.last_name,
            photo: teacher.photo,
            second_email: teacher.second_email,
            first_email: teacher.user?.email,
            first_phone: teacher.first_phone,
            second_phone: teacher.second_phone,
            date_of_birth: teacher.date_of_birth,
            age: teacher.age,
            title: teacher.title,
            gender: teacher.gender,
            schoolID: teacher.school._id,
            schoolName: teacher.school.schoolName,
            // classes: teacher.classes,
            recentIncidents,
            totalClasses: teacher.classes.length,
            totalStudents: teacher.classes.reduce((acc, curr) => acc + (curr.students?.length || 0), 0)
        };
    }

    async getStudentProfile(studentId) {
        const student = await Student.findById(studentId)
            .populate({
                path: 'class',
                select: 'ClassName Subject -_id school',
                // populate: {
                //     path: 'teacher',
                //     select: 'first_name last_name',
                //     model: 'Teacher'
                // }
            })
            .populate({
                path: 'parent',
                select: 'first_name last_name email phone'
            }).populate({
                path: 'user', select: 'email'
            });

        if (!student) {
            throw new Error('Student not found');
        }

        // Get student's incidents
        const incidents = await Incident.find({ student: student._id })
            .sort({ dateTime: -1 })
            .populate({
                path: 'reporter',
                select: 'email role'
            });

        return {
            id: student._id,
            first_name: student.first_name,
            last_name: student.last_name,
            photo: student.photo,
            second_email: student.second_email,
            first_phone: student.first_phone,
            second_phone: student.second_phone,
            date_of_birth: student.date_of_birth,
            gender: student.gender,
            ClassName: student.class.ClassName,
            Subject: student.class.Subject,
            parent: student.parent,
            incidents,
            totalIncidents: incidents.length,
            first_email: student.user?.email,
            schoolID: student.class.school
        };
    }

    async getParentProfile(parentId) {
        const parent = await Parent.findById(parentId)
            .populate('user', 'email')
            .populate({
                path: 'students',
                select: 'first_name last_name class',
                populate: {
                    path: 'class',
                    select: 'name teacher',
                    populate: {
                        path: 'teacher',
                        select: 'first_name last_name title'
                    }
                }
            });

        if (!parent) {
            throw new Error('Parent not found');
        }

        // Get incidents for all students of this parent
        const studentIds = parent.students.map(student => student._id);
        const incidents = await Incident.find({ student: { $in: studentIds } })
            .populate('student', 'first_name last_name')
            .populate({
                path: 'class',
                select: 'name teacher',
                populate: {
                    path: 'teacher',
                    select: 'first_name last_name title'
                }
            })
            .sort({ created_at: -1 });

        return {

            id: parent._id,
            first_name: parent.first_name,
            last_name: parent.last_name,

            first_email: parent.first_email,
            second_email: parent.second_email,
            first_phone: parent.first_phone,
            second_phone: parent.second_phone,
            gender: parent.gender,
            date_of_birth: parent.date_of_birth,
            profile_image: parent.profile_image,
            first_email: parent.user.email,
            photo: null,
            

            // students: parent.students.map(student => ({
            //     id: student._id,
            //     name: `${student.first_name} ${student.last_name}`,
            //     class: student.class ? {
            //         id: student.class._id,
            //         name: student.class.name,
            //         teacher: student.class.teacher ? {
            //             id: student.class.teacher._id,
            //             name: `${student.class.teacher.first_name} ${student.class.teacher.last_name}`,
            //             title: student.class.teacher.title
            //         } : null
            //     } : null
            // })),
            // incidents: incidents.map(incident => ({
            //     id: incident._id,
            //     type: incident.type,
            //     description: incident.description,
            //     status: incident.status,
            //     created_at: incident.created_at,
            //     student: {
            //         id: incident.student._id,
            //         name: `${incident.student.first_name} ${incident.student.last_name}`
            //     },
            //     class: incident.class ? {
            //         id: incident.class._id,
            //         name: incident.class.name,
            //         teacher: incident.class.teacher ? {
            //             id: incident.class.teacher._id,
            //             name: `${incident.class.teacher.first_name} ${incident.class.teacher.last_name}`,
            //             title: incident.class.teacher.title
            //         } : null
            //     } : null
            // })),
            // stats: {
            //     total_students: parent.students.length,
            //     total_incidents: incidents.length
            // }
        };
    }

    async getSuperAdminProfile(superAdminId) {
        // First get the user to verify it exists and get basic info
        const user = await User.findById(superAdminId)
            .select('-password');

        if (!user) {
            throw new Error('User not found');
        }

        // Then get the super admin profile
        const superAdmin = await SuperAdmin.findOne({ user: superAdminId })
            .select('-password');

        if (!superAdmin) {
            throw new Error('Super Admin profile not found');
        }

        console.log("✅ Found SuperAdmin profile:", superAdmin);

        return {
            id: user._id,
            first_name: superAdmin.firstName,
            last_name: superAdmin.lastName,
            photo: superAdmin.photo,
            first_email: superAdmin.firstEmail,
            second_email: superAdmin.secondEmail,
            first_phone: superAdmin.firstPhone,
            second_phone: superAdmin.secondPhone,
            date_of_birth: superAdmin.dateOfBirth,
            gender: superAdmin.gender,
            role: user.role,
            address: superAdmin.address,
        };
    }

    async updateStudentProfile(studentId, updateData, photoFile) {
        const { first_email, password, ...otherUpdates } = updateData;

        console.log("➡️ Starting updateStudent for ID:", studentId);
        console.log("📥 updateData received:", updateData);
        console.log("📷 photoFile received:", photoFile ? photoFile.originalname : 'No file');

        // Get the student with user data
        const originalStudent = await Student.findById(studentId).populate('user');
        if (!originalStudent) {
            console.log("❌ Student not found with ID:", studentId);
            throw new Error('Student not found');
        }
        console.log("✅ Found originalStudent:", originalStudent);

        // Handle photo upload
        if (photoFile) {
            console.log("📸 Processing photo upload...");

            // Create upload directory if it doesn't exist
            const uploadDir = path.join(__dirname, '../../uploads/students');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Generate unique filename
            const timestamp = Date.now();
            const ext = path.extname(photoFile.originalname);
            const filename = `student_${studentId}_${timestamp}${ext}`;
            const filepath = path.join(uploadDir, filename);

            // Save the file
            fs.writeFileSync(filepath, photoFile.buffer);
            console.log("✅ Photo saved to:", filepath);

            // Delete old photo if exists
            if (originalStudent.photo) {
                const oldPhotoPath = path.join(__dirname, '../../uploads', originalStudent.photo.replace('/uploads/', ''));
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                    console.log("🗑️ Old photo deleted:", oldPhotoPath);
                }
            }

            // Update photo path
            otherUpdates.photo = `/uploads/students/${filename}`;
            console.log("📷 Photo path updated to:", otherUpdates.photo);
        }

        // Update user
        if (first_email || password) {
            console.log("✏️ Updating User data...");
            const userUpdates = {};

            if (first_email) {
                console.log("📧 Checking email availability:", first_email);
                const existingUser = await User.findOne({
                    email: first_email,
                    _id: { $ne: originalStudent.user._id }
                });
                if (existingUser) {
                    console.log("❌ Email already registered:", first_email);
                    throw new Error('Email already registered');
                }
                userUpdates.email = first_email;
            }

            if (password?.trim()) {
                console.log("🔑 Hashing new password...");
                userUpdates.password = await bcrypt.hash(password, 10);
            }

            if (Object.keys(userUpdates).length > 0) {
                console.log("⬆️ Updating User with:", userUpdates);
                await User.findByIdAndUpdate(originalStudent.user._id, userUpdates);
                console.log("✅ User updated successfully");
            }
        }

        // Update student
        console.log("✏️ Updating Student with:", otherUpdates);
        const updatedStudent = await Student.findByIdAndUpdate(studentId, otherUpdates, {
            new: true
        }).populate('user', 'email');

        console.log("✅ Student updated successfully:", updatedStudent);

        // Prepare response
        const result = updatedStudent.toObject();
        result.first_email = updatedStudent.user?.email;
        delete result.user;

        console.log("✅ Final result to return:", result);
        console.log("➡️ updateStudent finished successfully for ID:", studentId);

        return result;
    }
}

module.exports = new ProfileService();