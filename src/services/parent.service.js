const Parent = require('../models/parent.model');
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const Student = require('../models/student.model');


const mongoose = require('mongoose');

const addParent = async (parentData, fileUrl) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { first_email, password, secound_email, first_phone, secound_phone, studentIds, ...rest } = parentData;

        // Check if email already exists in User
        const existingUser = await User.findOne({ email: first_email }).session(session);
        if (existingUser) {
            throw new Error('Email already registered.');
        }

        // Create User
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            email: first_email,
            password: hashedPassword,
            role: 'parent',
        });
        const savedUser = await user.save({ session });

        // Validate student existence
        if (studentIds && studentIds.length > 0) {
            const studentsExist = await Student.find({ _id: { $in: studentIds } }).session(session);
            if (studentsExist.length !== studentIds.length) {
                throw new Error("Some students not found.");
            }
        }

        // Create Parent
        const parent = new Parent({
            user: savedUser._id,
            first_phone,
            secound_email,
            secound_phone,
            profile_image: fileUrl,
            students: studentIds || [],
            ...rest,
        });
        const savedParent = await parent.save({ session });

        // Update students to include parent reference
        if (studentIds && studentIds.length > 0) {
            await Student.updateMany(
                { _id: { $in: studentIds } },
                { $set: { parent: savedParent._id } },
                { session }
            );
        }

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        return savedParent;

    } catch (error) {
        // Rollback changes
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};







// Get all parents
const getParents = async () => {
    return await Parent.find();
};

// Get a single parent by ID
const getParentById = async (id) => {
    return await Parent.findById(id);
};

// Update a parent by ID
const updateParent = async (id, updateData) => {
    return await Parent.findByIdAndUpdate(id, updateData, { new: true });
};

// Delete a parent by ID
const deleteParent = async (id) => {
    return await Parent.findByIdAndDelete(id);
};

module.exports = {
    addParent,
    getParents,
    getParentById,
    updateParent,
    deleteParent,
};



