const classService = require('../services/class.service');

// Get all classes
const getClasses = async (req, res) => {
  try {
    const classes = await classService.getAllClasses(req);
    res.status(200).json(classes);
  } catch (error) {
    if (error.message === 'School not found' || 
        error.message === 'Teacher not found or not assigned to a school') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get classes by school ID
const getClassesBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const classes = await classService.getClassesBySchoolId(schoolId);
    res.status(200).json(classes);
  } catch (error) {
    if (error.message === "School not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get a single class by ID
const getClassById = async (req, res) => {
  try {
    const classDoc = await classService.getClassById(req.params.id, req);
    res.status(200).json(classDoc);
  } catch (error) {
    if (error.message === 'Class not found' || 
        error.message === 'Access denied to this class') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Create a new class
const createClass = async (req, res) => {
  try {
    const newClass = await classService.createClass(req.body);
    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a class
const updateClass = async (req, res) => {
  try {
    const updatedClass = await classService.updateClass(req.params.id, req.body);
    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.status(200).json(updatedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a class
const deleteClass = async (req, res) => {
  try {
    const deletedClass = await classService.deleteClass(req.params.id);
    if (!deletedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.status(200).json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const addTeacherToClass = async (req, res) => {
  try {
    const { classId, teacherId } = req.body;
    if (!classId || !teacherId) {
      return res.status(400).json({ message: 'classId and teacherId are required' });
    }

    const updatedClass = await classService.addTeacherToClass(classId, teacherId);
    if (!updatedClass) {
      return res.status(404).json({ message: 'Class or Teacher not found' });
    }
    res.status(200).json(updatedClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeTeacherFromClass = async (req, res) => {
  try {
    const { classId, teacherId } = req.body;
    if (!classId || !teacherId) {
      return res.status(400).json({ message: 'classId and teacherId are required' });
    }
    
    const updatedClass = await classService.removeTeacherFromClass(classId, teacherId);
    if (!updatedClass) {
      return res.status(404).json({ message: 'Class or Teacher not found' });
    }
    res.status(200).json(updatedClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassesBySchool,
  addTeacherToClass,
  removeTeacherFromClass
};
