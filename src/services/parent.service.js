const Parent = require('../models/parent.model');
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const Student = require('../models/student.model');


const addParent = async (parentData, fileUrl) => {
    const { first_email,password,secound_email, first_phone, studentIds, ...rest } = parentData;

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
        role: 'parent',
    });
    const savedUser = await user.save();

    // Validate student existence
    if (studentIds && studentIds.length > 0) {
        const studentsExist = await Student.find({ _id: { $in: studentIds } });

        if (studentsExist.length !== studentIds.length) {
            throw new Error("Some students not found.");
        }
    }

    // Create Parent
    const parent = new Parent({
        user: savedUser._id,
        first_phone,
        profile_image: fileUrl,
        students: studentIds || [], // Link students if provided
        ...rest,
    });

    // Update students to include parent reference
    if (studentIds && studentIds.length > 0) {
        await Student.updateMany(
            { _id: { $in: studentIds } },
            { $set: { parent: savedParent._id } }
        );
    }

    return await parent.save();
}


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



