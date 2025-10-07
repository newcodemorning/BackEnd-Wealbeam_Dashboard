const mongoose = require('mongoose');
const Class = require('./class.model');
const Student = require('./student.model');
const User = require('./user.model');
const Parent = require('./parent.model');
const School = require('./school.model');
const Teacher = require('./teacher.model');

// Create indexes for better query performance
const createIndexes = async () => {
  try {
    // Class indexes
    await Class.collection.createIndex({ school: 1 });
    await Class.collection.createIndex({ teacher: 1 });
    await Class.collection.createIndex({ students: 1 });

    // Student indexes
    await Student.collection.createIndex({ user: 1 });
    await Student.collection.createIndex({ class: 1 });
    await Student.collection.createIndex({ parent: 1 });
    await Student.collection.createIndex({ school: 1 });

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });

    // Parent indexes
    await Parent.collection.createIndex({ user: 1 });
    await Parent.collection.createIndex({ students: 1 });

    // School indexes
    await School.collection.createIndex({ user: 1 });
    await School.collection.createIndex({ classes: 1 });

    // Teacher indexes
    await Teacher.collection.createIndex({ user: 1 });
    await Teacher.collection.createIndex({ school: 1 });
    await Teacher.collection.createIndex({ classes: 1 });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
};

module.exports = { createIndexes }; 