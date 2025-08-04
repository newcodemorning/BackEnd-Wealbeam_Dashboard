const School = require('../models/school.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const Incident = require('../models/incident.model');
const Class = require('../models/class.model');
const User = require('../models/user.model');
const SuperAdmin = require('../models/super-admin.model');

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
            .populate({
                path: 'school',
                select: 'schoolName'
            })
            .populate({
                path: 'classes',
                select: 'ClassName Subject SelectDate',
                populate: {
                    path: 'students',
                    select: 'first_name last_name photo',
                    model: 'Student'
                }
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

        return {
            first_name: teacher.first_name,
            last_name: teacher.last_name,
            photo: teacher.photo,
            age: teacher.age,
            title: teacher.title,
            gender: teacher.gender,
            school: teacher.school,
            classes: teacher.classes,
            recentIncidents,
            totalClasses: teacher.classes.length,
            totalStudents: teacher.classes.reduce((acc, curr) => acc + (curr.students?.length || 0), 0)
        };
    }

    async getStudentProfile(studentId) {
        const student = await Student.findById(studentId)
            .populate({
                path: 'class',
                select: 'ClassName Subject',
                populate: {
                    path: 'teacher',
                    select: 'first_name last_name',
                    model: 'Teacher'
                }
            })
            .populate({
                path: 'parent',
                select: 'first_name last_name email phone'
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
            id:student._id,
            first_name: student.first_name,
            last_name: student.last_name,
            photo: student.photo,
            second_email: student.second_email,
            first_phone: student.first_phone,
            second_phone: student.second_phone,
            date_of_birth: student.date_of_birth,
            gender: student.gender,
            class: student.class,
            parent: student.parent,
            incidents,
            totalIncidents: incidents.length
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
            parent: {
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
                email: parent.user.email
            },
            students: parent.students.map(student => ({
                id: student._id,
                name: `${student.first_name} ${student.last_name}`,
                class: student.class ? {
                    id: student.class._id,
                    name: student.class.name,
                    teacher: student.class.teacher ? {
                        id: student.class.teacher._id,
                        name: `${student.class.teacher.first_name} ${student.class.teacher.last_name}`,
                        title: student.class.teacher.title
                    } : null
                } : null
            })),
            incidents: incidents.map(incident => ({
                id: incident._id,
                type: incident.type,
                description: incident.description,
                status: incident.status,
                created_at: incident.created_at,
                student: {
                    id: incident.student._id,
                    name: `${incident.student.first_name} ${incident.student.last_name}`
                },
                class: incident.class ? {
                    id: incident.class._id,
                    name: incident.class.name,
                    teacher: incident.class.teacher ? {
                        id: incident.class.teacher._id,
                        name: `${incident.class.teacher.first_name} ${incident.class.teacher.last_name}`,
                        title: incident.class.teacher.title
                    } : null
                } : null
            })),
            stats: {
                total_students: parent.students.length,
                total_incidents: incidents.length
            }
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

        return {
            id: user._id,
            email: user.email,
            role: user.role,
            profile: {
                id: superAdmin._id,
                firstName: superAdmin.firstName,
                lastName: superAdmin.lastName,
                address: superAdmin.address,
                photo: superAdmin.photo,
                phoneNumber: superAdmin.phoneNumber,
                firstEmail: superAdmin.firstEmail,
                secondEmail: superAdmin.secondEmail
            }
        };
    }
}

module.exports = new ProfileService(); 