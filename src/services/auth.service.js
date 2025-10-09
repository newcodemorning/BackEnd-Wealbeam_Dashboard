const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
// const Parent = require('../models/parent.model'); // Assuming Parent is a Mongoose model
const User = require('../models/user.model');
const School = require('../models/school.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const { ObjectId } = mongoose.Types;

class AuthService {
  // /**
  //  * Register a new parent in the MongoDB database
  //  * @param {String} first_email
  //  * @param {String} secound_email
  //  * @param {String} profile_image
  //  * @param {String} gender
  //  * @param {Date} date_of_birth
  //  * @param {String} password
  //  * @param {String} first_name
  //  * @param {String} last_name
  //  * @param {String} first_phone
  //  * @param {String} secound_phone
  //  * @returns {Object} Parent record with ID
  //  */
  // async registerParent(parentData,fileUrl) {
  //   const { first_email, secound_email, first_phone, ...rest } = parentData;
  
  //   // Check if email already exists in User
  //   const existingUser = await User.findOne({ email: first_email });
  //   if (existingUser) {
  //     throw new Error('Email already registered.');
  //   }
  
  //   // Create User
  //   const hashedPassword = await bcrypt.hash(first_phone, 10);
  //   const user = new User({
  //     email: first_email,
  //     password: hashedPassword,
  //     role: 'parent',
  //   });
  //   const savedUser = await user.save();
  
  //   // Create Parent
  //   const parent = new Parent({
  //     user: savedUser._id,
  //     first_phone,
  //     profile_image:fileUrl,
  //     ...rest,
  //   });
  //   return await parent.save();
  // }  

  /**
   * Login with email and password
   * @param {String} email
   * @param {String} password
   * @returns {Object} Token and role
   */
  async login(email, password) {
    const user = await User.findOne({ email });
    console.log( email);
    console.log(user);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Get the specific role ID based on user role
    let roleId;
    switch (user.role) {
      case 'school':
        const school = await School.findOne({ user: user._id });
        if (!school) throw new Error('School profile not found');
        roleId = school._id;
        break;
      case 'teacher':
        const teacher = await Teacher.findOne({ user: user._id });
        if (!teacher) throw new Error('Teacher profile not found');
        roleId = teacher._id;
        break;
      case 'student':
        const student = await Student.findOne({ user: user._id });
        if (!student) throw new Error('Student profile not found');
        roleId = student._id;
        break;
      case 'parent':
        const parent = await Parent.findOne({ user: user._id });
        if (!parent) throw new Error('Parent profile not found');
        roleId = parent._id;
        break;
      default:
        roleId = user._id; // For other roles like super-admin
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        roleId: roleId
      },
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );

    return { 
      message: 'Login successful', 
      role: user.role, 
      id: user._id, 
      roleId: roleId,
      token 
    };
  }

  // /**
  //  * Assign a role to an existing parent
  //  * @param {String} id
  //  * @param {String} role
  //  * @returns {Object} Updated parent record
  //  */
  // async assignRole(id, role) {
    
  //   if (!ObjectId.isValid(id)) {
  //     throw new Error('Invalid ID');
  //   }

  //   const updatedParent = await Parent.findByIdAndUpdate(
  //     id,
  //     { role },
  //     { new: true }
  //   );

  //   if (!updatedParent) {
  //     throw new Error('Parent not found');
  //   }

  //   return { id: updatedParent._id, role: updatedParent.role };
  // }

  async changePassword(userId, currentPassword, newPassword) {
    try {
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        user.password = hashedPassword;
        await user.save();

        return { message: 'Password changed successfully' };
    } catch (error) {
        throw new Error(error.message);
    }
  }
}

module.exports = new AuthService();
