const parentService = require('../services/parent.service');
const { bucket } = require('../config/firebase');



// Add a new parent
const addParent = async (req, res) => {
  try {
    const {
      first_email, second_email, gender, date_of_birth, password,
      first_name, last_name, first_phone, second_phone
    } = req.body;

    let fileUrl = null;

    // Handle file upload only if a file is provided
    if (req.file) {
      try {
        const fileName = Date.now() + '-' + req.file.originalname.replace(/\s+/g, '_').replace(' ', '_');
        const file = bucket.file(`uploads/${fileName}`);
        await file.save(req.file.buffer, {
          metadata: { contentType: req.file.mimetype },
        });
        await file.makePublic();
        fileUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
      } catch (fileError) {
        return res.status(500).json({ message: "Error uploading file", error: fileError.message });
      }
    }

    // Call service to add parent
    const parent = await parentService.addParent(req.body, fileUrl);
    res.status(201).json(parent);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Get all parents
const getParents = async (req, res) => {
  try {
    const parents = await parentService.getParents();
    res.status(200).json(parents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single parent by ID
const getParentById = async (req, res) => {
  try {
    const parent = await parentService.getParentById(req.params.id);
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }
    res.status(200).json(parent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a parent by ID
const updateParent = async (req, res) => {
  try {
    const parent = await parentService.updateParent(req.params.id, req.body);
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }
    res.status(200).json(parent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a parent by ID
const deleteParent = async (req, res) => {
  try {
    const parent = await parentService.deleteParent(req.params.id);
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }
    res.status(200).json({ message: 'Parent deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addParent,
  getParents,
  getParentById,
  updateParent,
  deleteParent,
};
