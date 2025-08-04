const teacherService = require('../services/teacher.service');

// Get teachers by school ID
const getTeachersBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const teachers = await teacherService.getTeachersBySchoolId(schoolId);
    res.status(200).json(teachers);
  } catch (error) {
    if (error.message === "School not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get teacher by class ID
const getTeacherByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacher = await teacherService.getTeacherByClassId(classId);
    res.status(200).json(teacher);
  } catch (error) {
    if (error.message === "Class not found" || error.message === "No teacher found for this class") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get all teachers
const getTeachers = async (req, res) => {
  try {
    const teachers = await teacherService.getTeachers(req);
    res.status(200).json(teachers);
  } catch (error) {
    if (error.message === 'School not found' || error.message === 'Teacher not found or not assigned to a school') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get a single teacher by ID
const getTeacherById = async (req, res) => {
  try {
    const teacher = await teacherService.getTeacherById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.status(200).json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new teacher
const addTeacher = async (req, res) => {
  try {
    const teacher = await teacherService.addTeacher(req.body, req?.file);
    res.status(201).json(teacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a teacher
const updateTeacher = async (req, res) => {
  try {
    const updatedTeacher = await teacherService.updateTeacher(req.params.id, req.body);
    if (!updatedTeacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.status(200).json(updatedTeacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a teacher
const deleteTeacher = async (req, res) => {
  try {
    const deletedTeacher = await teacherService.deleteTeacher(req.params.id);
    if (!deletedTeacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTeachers,
  getTeacherById,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  getTeachersBySchool,
  getTeacherByClass
};