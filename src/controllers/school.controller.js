const schoolService = require('../services/school.service');

const createSchool =async (req, res) => {
  try {
    const newSchool = await schoolService.createSchool(req.body);
    res.status(201).json(newSchool);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
  

const getAllSchools = async (req, res) => {
    try {
        const schools = await schoolService.getAllSchools();
        res.status(200).json(schools);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSchoolById = async (req, res) => {
    try {
        const school = await schoolService.getSchoolById(req.params.id);
        if (school) {
            res.status(200).json(school);
        } else {
            res.status(404).json({ message: 'School not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateSchool = async (req, res) => {
    try {
        const updatedSchool = await schoolService.updateSchool(req.params.id, req.body);
        if (updatedSchool) {
            res.status(200).json(updatedSchool);
        } else {
            res.status(404).json({ message: 'School not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteSchool = async (req, res) => {
    try {
        const deletedSchool = await schoolService.deleteSchool(req.params.id);
        if (deletedSchool) {
            res.status(200).json({ message: 'School deleted successfully' });
        } else {
            res.status(404).json({ message: 'School not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createSchool,
    getAllSchools,
    getSchoolById,
    updateSchool,
    deleteSchool
};
