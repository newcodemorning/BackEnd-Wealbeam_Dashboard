const SuperAdmin = require('../models/super-admin.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const { v4: uuidv4 } = require('uuid');
const { bucket } = require('../config/firebase'); // If you're uploading files to Firebase Storage

// Create a new Super Admin
const createSuperAdmin = async (superAdminData) => {
  const { first_email, secound_email, password, ...rest } = superAdminData;
  // Check if email already exists in User
  const existingUser = await User.findOne({ email: first_email });

  if (existingUser) {
    throw new Error('Email already registered.');
  }

  // Create User
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    email: first_email,
    password: hashedPassword,
    role: 'super-admin',
  });
  const savedUser = await user.save();

  // Create Parent
  const admin = new SuperAdmin({
    user: savedUser._id,
    ...rest,
  });
  return await admin.save();
};

// Get Super Admin by ID
const getSuperAdminById = async (id) => {
  return await SuperAdmin.findById(id);
};


// Login Super Admin


// Update Super Admin personal information
const updateSuperAdmin = async (id, updateData, file) => {
  if (file) {
    const fileconten = bucket.file(`uploads/${file.originalname}`);
    await fileconten.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });
    await fileconten.makePublic();

    // Get the public URL of the uploaded file
    const photoUrl = `https://storage.googleapis.com/${bucket.name}/${fileconten.name}`
    updateData.photo = photoUrl;
  }
  return await SuperAdmin.findByIdAndUpdate(id, updateData, { new: true });
};

// Change Super Admin password
const changePassword = async (id, oldPassword, newPassword) => {
  const superAdmin = await SuperAdmin.findById(id);
  if (!superAdmin) {
    throw new Error('Super Admin not found');
  }

  const isMatch = await superAdmin.comparePassword(oldPassword);
  if (!isMatch) {
    throw new Error('Old password is incorrect');
  }

  superAdmin.password = newPassword;
  return await superAdmin.save();
};

module.exports = {
  createSuperAdmin,
  getSuperAdminById,
  updateSuperAdmin,
  changePassword,
  
};