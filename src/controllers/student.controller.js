// controllers/studentController.js
const fs = require('fs');
const studentService = require('../services/student.service');
const { exportStudentsToCSV } = require('../services/student.service_csv');
const path = require('path');
// Add a new student
const addStudent = async (req, res) => {
  try {
    const student = await studentService.addStudent(req.body, req?.file);
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all students
const getStudents = async (req, res) => {
  try {
    const students = await studentService.getStudents(req);
    res.status(200).json(students);
  } catch (error) {
    if (error.message === 'School not found' || 
        error.message === 'Teacher not found or not assigned to a school' ||
        error.message === 'Parent not found' ||
        error.message === 'Student not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get a single student by ID
const getStudentById = async (req, res) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    let lang = req.lang || 'en';
    student.first_name = student.first_name[lang];
    student.last_name = student.last_name[lang];

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a student by ID
const updateStudent = async (req, res) => {
  try {
    const student = await studentService.updateStudent(req.params.id, req.body);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a student by ID
const deleteStudent = async (req, res) => {
  try {
    const student = await studentService.deleteStudent(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const importStudents = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      throw new Error('File buffer missing!');
    }

    const importResult = await studentService.importStudentsFromCSV(req.file.buffer);
    
    if (importResult.errors.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Import completed with some errors",
        importedCount: importResult.results.length,
        errorCount: importResult.errors.length,
        errors: importResult.errors
      });
    }

    res.status(200).json({
      success: true,
      message: "Import completed successfully",
      importedCount: importResult.results.length,
     errors: importResult.errors // <-- Add this line
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const exportStudents = async (req, res) => {
  try {
    const fileName = `students-${Date.now()}.csv`;
    const filePath = `/tmp/${fileName}`; // Use /tmp directory

    // Generate CSV and write to /tmp
    await exportStudentsToCSV(filePath);

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    // Stream from /tmp
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Cleanup after stream finishes
    fileStream.on('end', () => {
      fs.unlinkSync(filePath); // Delete from /tmp
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get students by class ID
const getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const students = await studentService.getStudentsByClassId(classId, req);
    res.status(200).json(students);
  } catch (error) {
    if (error.message === "Class not found" || 
        error.message === "Access denied to this class") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  importStudents,
  exportStudents,
  getStudentsByClass
};