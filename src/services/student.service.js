const Student = require('../models/student.model');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { bucket } = require('../config/firebase');
const User = require('../models/user.model');
const Class = require('../models/class.model');
const Parent = require('../models/parent.model');
const path = require('path');
const { parse } = require('csv-parse');
const School = require('../models/school.model');
const Teacher = require('../models/teacher.model');
const i18n = require('../config/i18n');

// Add a new student
const addStudent = async (studentData, file) => {
  const { first_email, first_phone, class_id, parent_id, photo, ...rest } = studentData;

  console.log('Adding student with data:', {
    email: first_email,
    class_id,
    parent_id
  });

  // Validate required fields
  if (!first_email || !class_id) {
    throw new Error(i18n.__('validation.required'));
  }

  // Check existing user
  const existingUser = await User.findOne({ email: first_email });
  if (existingUser) {
    throw new Error(i18n.__('auth.email_already_registered'));
  }

  // Find class ID and get its school
  const classObj = await Class.findById(class_id)
    .populate('school', '_id');

  if (!classObj) {
    throw new Error(i18n.__('student.class_not_found', { class_id }));
  }

  if (!classObj.school) {
    throw new Error(i18n.__('student.class_no_school', { class_id }));
  }

  console.log('Found class:', {
    classId: classObj._id,
    className: classObj.ClassName,
    schoolId: classObj.school._id
  });

  // Find parent by ID if provided
  let parent = null;
  if (parent_id) {
    parent = await Parent.findById(parent_id);
    if (!parent) {
      throw new Error(`Parent with ID "${parent_id}" not found`);
    }
    console.log('Found parent:', {
      parentId: parent._id,
      name: `${parent.first_name} ${parent.last_name}`
    });
  }

  // Handle photo upload
  let photoUrl = '';
  if (file) {
    try {
      const fileconten = bucket.file(`uploads/students/${file.originalname}`);
      await fileconten.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      });
      await fileconten.makePublic();
      photoUrl = `https://storage.googleapis.com/${bucket.name}/${fileconten.name}`;
      console.log('Photo uploaded successfully:', photoUrl);
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new Error('Failed to upload photo');
    }
  }

  // Create User
  const hashedPassword = await bcrypt.hash(first_phone, 10);
  const user = new User({
    email: first_email,
    password: hashedPassword,
    role: 'student',
  });
  const savedUser = await user.save();
  console.log('Created user account:', savedUser._id);

  // Create student
  const student = new Student({
    ...rest,
    user: savedUser._id,
    first_phone,
    class: classObj._id,
    parent: parent?._id || null,
    photo: photoUrl || "",
    date_of_birth: studentData.date_of_birth ? new Date(studentData.date_of_birth.split('/').reverse().join('-')) : null,
    gender: studentData.gender === 'M' ? 'Male' : 'Female',
    school: classObj.school._id
  });

  const savedStudent = await student.save();
  console.log('Created student:', {
    studentId: savedStudent._id,
    name: `${savedStudent.first_name} ${savedStudent.last_name}`,
    class: classObj.ClassName,
    school: classObj.school._id
  });

  // Update class's students array
  await Class.findByIdAndUpdate(
    classObj._id,
    { $addToSet: { students: savedStudent._id } },
    { new: true }
  );
  console.log('Updated class students array');

  // Update parent's students array if parent exists
  if (parent) {
    await Parent.findByIdAndUpdate(
      parent._id,
      { $addToSet: { students: savedStudent._id } },
      { new: true }
    );
    console.log('Updated parent students array');
  }

  return savedStudent;
};

// Get all students
const getStudents = async (req) => {
  let query = {};

  // If user is a school, only get students from their school
  if (req.user.role === 'school') {
    const school = await School.findOne({ user: req.user.id });
    if (!school) {
      throw new Error('School not found');
    }
    query.school = school._id;
  }

  // If user is a teacher, only get students from their classes
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher || !teacher.school) {
      throw new Error('Teacher not found or not assigned to a school');
    }
    const teacherClasses = await Class.find({ teacher: teacher._id }).distinct('_id');
    query.class = { $in: teacherClasses };
  }

  // If user is a parent, only get their children
  if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ user: req.user.id });
    if (!parent) {
      throw new Error('Parent not found');
    }
    query.parent = parent._id;
  }

  // If user is a student, only get their own data
  if (req.user.role === 'student') {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      throw new Error('Student not found');
    }
    query._id = student._id;
  }

  const { page, limit, skip } = req.pagination;
  const total = await Student.countDocuments(query);

  const students = await Student.find(query)
    .populate('user', 'email')
    .populate('class', '-students  -createdAt -updatedAt -__v')
    .populate('parent', '-students -createdAt -updatedAt -__v -user')
    .skip(skip)
    .limit(limit);

  let lang = req.lang || 'en';
  const cleanedStudents = students.map((student) => {
    const studentData = student.toObject();
    studentData.first_email = student.user?.email || '';
    studentData.first_name = student.first_name[lang];
    studentData.last_name = student.last_name[lang];
    delete studentData.user;
    return studentData;
  });

  return {
    page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    data: cleanedStudents
  };


};

// Get a single student by ID 
const getStudentById = async (id) => {
  const student = await Student.findById(id)
    .populate('user', 'email')
    .populate('class', '-students  -createdAt -updatedAt -__v')
    .populate('parent', '-students -createdAt -updatedAt -__v -user');

  if (!student) return null;

  const studentData = student.toObject();
  // Add first_email from the associated User
  studentData.first_email = student.user?.email || '';
  // Remove the nested user object if not needed
  delete studentData.user;
  return studentData;
};

// Update a student by ID
const updateStudent = async (id, updateData) => {
  const { first_email, password, ...otherUpdates } = updateData;

  // Get original student data before update
  const originalStudent = await Student.findById(id).populate('user');
  if (!originalStudent) {
    throw new Error('Student not found');
  }

  // Update user email and password if provided
  if (first_email || password) {
    const userUpdates = {};

    if (first_email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email: first_email,
        _id: { $ne: originalStudent.user._id }
      });
      if (existingUser) {
        throw new Error('Email already registered');
      }
      userUpdates.email = first_email;
    }

    if (password) {
      userUpdates.password = await bcrypt.hash(password, 10);
    }

    // Update user
    await User.findByIdAndUpdate(originalStudent.user._id, userUpdates);
  }

  // Perform the student update
  const updatedStudent = await Student.findByIdAndUpdate(id, otherUpdates, {
    new: true
  }).populate('user', 'email');

  // Check if class was changed
  const originalClassId = originalStudent.class?.toString();
  const updatedClassId = updatedStudent.class?.toString();

  if (originalClassId !== updatedClassId) {
    // Remove from old class if it existed
    if (originalClassId) {
      await Class.findByIdAndUpdate(
        originalClassId,
        { $pull: { students: originalStudent._id } }
      );
    }

    // Add to new class if present
    if (updatedClassId) {
      await Class.findByIdAndUpdate(
        updatedClassId,
        { $addToSet: { students: updatedStudent._id } }
      );
    }
  }

  // Return the updated student with the email
  const result = updatedStudent.toObject();
  result.first_email = updatedStudent.user?.email;
  delete result.user;
  return result;
};

// Delete a student by ID
const deleteStudent = async (id) => {
  // Find the student first to get all related data
  const studentToDelete = await Student.findById(id);
  if (!studentToDelete) {
    throw new Error('Student not found');
  }

  // Delete the student's user account
  if (studentToDelete.user) {
    await User.findByIdAndDelete(studentToDelete.user);
  }

  // Remove student from class's students array
  if (studentToDelete.class) {
    await Class.findByIdAndUpdate(studentToDelete.class, {
      $pull: { students: studentToDelete._id }
    });
  }

  // Remove student from parent's students array if exists
  if (studentToDelete.parent) {
    await Parent.findByIdAndUpdate(studentToDelete.parent, {
      $pull: { students: studentToDelete._id }
    });
  }

  // Finally delete the student
  return await Student.findByIdAndDelete(id);
};


const createStudentForImporting = async (studentData) => {
  console.log('[Import] Starting student import for:', {
    email: studentData.first_email,
    class: studentData.class_name,
    name: `${studentData.first_name} ${studentData.last_name}`
  });

  const { first_email, first_phone, class_name, parent_phone, photo, ...rest } = studentData;

  // Check existing user
  console.log('[Import] Checking for existing user with email:', first_email);
  const existingUser = await User.findOne({ email: first_email });
  if (existingUser) {
    console.log('[Import] User already exists with email:', first_email);
    throw new Error(i18n.__('auth.email_already_registered'));
  }
  console.log('[Import] No existing user found, proceeding...');

  // Find class by name and get its school
  console.log('[Import] Looking for class:', class_name);
  const trimmedClassName = class_name.trim().replace(/\s+/g, ' '); // Trim and normalize spaces
  const classObj = await Class.findOne({
    $expr: {
      $eq: [
        { $trim: { input: "$ClassName" } }, // Trim spaces from stored class name
        trimmedClassName
      ]
    }
  }).populate('school', '_id');

  if (!classObj) {
    console.log('[Import] Class not found:', trimmedClassName);
    throw new Error(`Class "${trimmedClassName}" not found`);
  }

  if (!classObj.school) {
    console.log('[Import] Class found but has no school:', trimmedClassName);
    throw new Error(`Class "${trimmedClassName}" is not associated with any school`);
  }
  console.log('[Import] Found class:', {
    className: classObj.ClassName,
    schoolId: classObj.school._id
  });

  // Find parent by phone if provided
  let parent = null;
  if (parent_phone) {
    console.log('[Import] Looking for parent with phone:', parent_phone);
    parent = await Parent.findOne({ first_phone: parent_phone });
    if (parent) {
      console.log('[Import] Found parent:', parent._id);
    } else {
      console.log('[Import] No parent found with phone:', parent_phone);
    }
  }

  // Create user with hashed phone as password
  console.log('[Import] Creating user account...');
  const hashedPassword = await bcrypt.hash(first_phone, 10);
  const user = new User({
    email: first_email,
    password: hashedPassword,
    role: 'student',
  });
  const savedUser = await user.save();
  console.log('[Import] User account created:', savedUser._id);

  let photoUrl = '';
  if (photo) {
    console.log('[Import] Processing photo...');
    try {
      // Upload photo to Firebase if URL is provided in CSV
      const response = await fetch(photo);
      if (!response.ok) {
        console.log('[Import] Failed to fetch photo:', response.status);
        throw new Error(`Failed to fetch photo: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filename = `student-${uuidv4()}${path.extname(photo)}`;
      const fileconten = bucket.file(`uploads/students/${filename}`);

      try {
        await fileconten.save(buffer, {
          metadata: {
            contentType: response.headers.get('content-type') || 'image/jpeg',
            cacheControl: 'public, max-age=31536000'
          },
          resumable: false
        });
        await fileconten.makePublic();
        photoUrl = `https://storage.googleapis.com/${bucket.name}/${fileconten.name}`;
        console.log('[Import] Photo uploaded successfully:', photoUrl);
      } catch (uploadError) {
        console.error('[Import] Error uploading to Firebase Storage:', uploadError);
      }
    } catch (error) {
      console.error('[Import] Error processing photo:', error);
    }
  }

  // Create student
  console.log('[Import] Creating student record...');
  const student = new Student({
    ...rest,
    user: savedUser._id,
    first_phone,
    class: classObj._id,
    parent: parent?._id || null,
    photo: photoUrl || "",
    date_of_birth: studentData.date_of_birth ? new Date(studentData.date_of_birth.split('/').reverse().join('-')) : null,
    gender: studentData.gender === 'M' ? 'Male' : 'Female',
    school: classObj.school._id
  });

  try {
    const savedStudent = await student.save();
    console.log('[Import] Student record created:', savedStudent._id);

    // Push student to class's students array
    console.log('[Import] Updating class students array...');
    await Class.findByIdAndUpdate(
      classObj._id,
      { $addToSet: { students: savedStudent._id } },
      { new: true }
    );

    // Push student to parent's students array if parent exists
    if (parent) {
      console.log('[Import] Updating parent students array...');
      await Parent.findByIdAndUpdate(
        parent._id,
        { $addToSet: { students: savedStudent._id } },
        { new: true }
      );
    }

    console.log('[Import] Student import completed successfully');
    return savedStudent;
  } catch (error) {
    console.error('[Import] Error saving student:', error);
    // Clean up the created user if student creation fails
    await User.findByIdAndDelete(savedUser._id);
    throw error;
  }
};


// Get students by class ID
const getStudentsByClassId = async (classId, req) => {
  // Validate class existence
  const classExists = await Class.findById(classId);
  if (!classExists) {
    throw new Error("Class not found");
  }

  // Check if user has access to this class
  if (req.user.role === 'school') {
    const school = await School.findOne({ user: req.user.id });
    if (!school || classExists.school.toString() !== school._id.toString()) {
      throw new Error("Access denied to this class");
    }
  } else if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher || classExists.teacher.toString() !== teacher._id.toString()) {
      throw new Error("Access denied to this class");
    }
  }

  // Get total count of students for pagination
  const { page, limit, skip } = req.pagination;
  
  const total = await Student.countDocuments({ class: classId });
  const totalPages = Math.ceil(total / limit);
  const currentPage = page;


  // Get students for the class
  const students = await Student.find({ class: classId })
    .populate('user', 'email')
    .populate('class', '-students  -createdAt -updatedAt -__v')
    .populate('parent', '-students  -createdAt -updatedAt -__v')
    .skip(skip)
    .limit(limit);
  
  let lang = req.lang || 'en';
  console.log('[Import] Processing students for language:', lang);
  const cleanedStudents = students.map((student) => {
    const studentData = student.toObject();
    studentData.first_email = student.user?.email || '';
    studentData.first_name = student.first_name[lang] || student.first_name;
    studentData.last_name = student.last_name[lang] || student.last_name;
    delete studentData.user;
    return studentData;
  });

  const paginatedStudents = {
    total,
    totalPages,
    currentPage,
    students: cleanedStudents
  };

  return paginatedStudents;
};


const importStudentsFromCSV = (fileBuffer) => {
  console.log('[Service] Starting CSV import process...');
  console.log('[Service] File buffer size:', fileBuffer.length);

  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, '../workers/importCSVWithWorker.js'));
    console.log('[Service] Worker created successfully');

    worker.postMessage(fileBuffer);
    console.log('[Service] File buffer sent to worker');

    worker.on('message', (result) => {
      console.log('[Service] Received message from worker:', {
        hasError: !!result.error,
        resultsCount: result.results?.length || 0,
        errorsCount: result.errors?.length || 0
      });

      if (result.error) {
        console.error('[Service] Worker reported error:', result.error);
        reject(new Error(result.error));
      } else {
        console.log('[Service] Import completed with results:', {
          successfulImports: result.results.length,
          errors: result.errors.length
        });
        resolve(result);
      }
    }),

      worker.on('error', (error) => {
        console.error('[Service] Worker error:', error);
        reject(error);
      }),

      worker.on('exit', (code) => {
        console.log('[Service] Worker exited with code:', code);
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      })

  });
};

module.exports = {
  addStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  createStudentForImporting,
  getStudentsByClassId,
  importStudentsFromCSV
};



// Note: Ensure that the worker script 'importCSVWithWorker.js' is implemented correctly to handle CSV parsing and student creation.