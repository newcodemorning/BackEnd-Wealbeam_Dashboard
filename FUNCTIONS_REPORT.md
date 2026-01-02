# WeAllBeam Codebase Function Report

Date: 2026-01-02

This document catalogs the primary functions implemented across the WeAllBeam application. Functions are grouped by folder and file, focusing on exported APIs (controllers, services, middleware, and utilities). Brief intent notes are inferred from names and context.

## Controllers

### `src/controllers/blog.controller.js`

- `getAllBlogs(req, res)`: List blogs with pagination and filters.
- `getAllBlogsForAdmin(req, res)`: Admin-focused blog listing with extended filters.
- `addBlog(req, res)`: Create a new blog post; supports file uploads.
- `checkSlugExists(req, res)`: Verify uniqueness of a blog slug.
- `getBlogById(req, res)`: Fetch a blog by ID.
- `getBlogAdminById(req, res)`: Admin view with extra fields.
- `getFilterOptions(req, res)`: Return filter metadata for blogs.
- `getBlogBySlug(req, res)`: Fetch a blog by slug.
- `deleteBlog(req, res)`: Delete a blog.
- `updateBlog(req, res)`: Update blog details and files.

### `src/controllers/teacher.controller.js`

- `getTeachersBySchool(req, res)`: List teachers by school.
- `getTeacherByClass(req, res)`: List teachers by class.
- `getTeachers(req, res)`: List teachers (general).
- `getTeacherById(req, res)`: Get teacher details by ID.
- `addTeacher(req, res)`: Create teacher.
- `updateTeacher(req, res)`: Update teacher.
- `deleteTeacher(req, res)`: Delete teacher.

### `src/controllers/parent.controller.js`

- `addParent(req, res)`: Create parent.
- `getParents(req, res)`: List parents.
- `getParentById(req, res)`: Get parent details.
- `updateParent(req, res)`: Update parent.
- `deleteParent(req, res)`: Delete parent.

### `src/controllers/class.controller.js`

- `getClasses(req, res)`: List classes.
- `getClassesBySchool(req, res)`: List classes by school.
- `getClassById(req, res)`: Get class details.
- `createClass(req, res)`: Create class.
- `updateClass(req, res)`: Update class.
- `deleteClass(req, res)`: Delete class.
- `addTeacherToClass(req, res)`: Assign teacher to class.
- `removeTeacherFromClass(req, res)`: Remove teacher from class.

### `src/controllers/forum.controller.js`

- `createPost(req, res)`: Create forum post.
- `addReply(req, res)`: Add reply to a post.
- `fetchPostWithReplies(req, res)`: Fetch post with thread.
- `fetchPosts(req, res)`: List posts.
- `toggleLikePost(req, res)`: Like/unlike a post.
- `toggleLikeReply(req, res)`: Like/unlike a reply.

### `src/controllers/contacts.controller.js`

- `createcontacts(req, res)`: Create contact message.
- `getAll(req, res)`: List contact messages.

### `src/controllers/student.controller.js`

- `addStudent(req, res)`: Create student.
- `getStudents(req, res)`: List students.
- `getStudentById(req, res)`: Get student details.
- `updateStudent(req, res)`: Update student.
- `deleteStudent(req, res)`: Delete student.
- `importStudents(req, res)`: Import students (CSV).
- `exportStudents(req, res)`: Export students (CSV).
- `getStudentsByClass(req, res)`: List students by class.

### `src/controllers/super-admin.controller.js`

- `createSuperAdmin(req, res)`: Create super admin.
- `getSuperAdmin(req, res)`: Get super admin profile.
- `updateSuperAdmin(req, res)`: Update super admin.
- `changePassword(req, res)`: Change password.

### `src/controllers/faq.controller.js`

- `createFq(req, res)`: Create FAQ.
- `getAllFqs(req, res)`: List FAQs.
- `updateFq(req, res)`: Update FAQ.
- `deleteFq(req, res)`: Delete FAQ.

### `src/controllers/pdf.controller.js`

- `uploadPDF(req, res)`: Upload PDF.
- `getAllPDFs(req, res)`: List PDFs.
- `getAllPDFsForDashboard(req, res)`: List PDFs (dashboard view).
- `downloadPDF(req, res)`: Download PDF file.
- `updatePDF(req, res)`: Update PDF metadata.
- `deletePDF(req, res)`: Delete PDF.
- `migratePDFs(req, res)`: Migrate PDFs.
- `getPDFForAdminById(req, res)`: Admin fetch by ID.
- `getFilterOptions(req, res)`: PDF filters metadata.
- `getPDFByIdPublic(req, res)`: Public fetch by ID.
- `getPDFByIdForDashboard(req, res)`: Dashboard fetch by ID.

### `src/controllers/school.controller.js`

- `createSchool(req, res)`: Create school.
- `getAllSchools(req, res)`: List schools.
- `getSchoolById(req, res)`: Get school details.
- `updateSchool(req, res)`: Update school.
- `deleteSchool(req, res)`: Delete school.

### `src/controllers/incident.controller.js`

- `createIncident(req, res)`: Create incident report.
- `getStudentIncidents(req, res)`: List incidents for student.
- `getIncident(req, res)`: Get incident details.
- `updateIncident(req, res)`: Update incident.
- `deleteIncident(req, res)`: Delete incident.

### `src/controllers/profile.controller.js`

- `getProfile(req, res)`: Get profile by role.
- `updateProfile(req, res)`: Update profile by role.

### `src/controllers/question.controller.js`

- `createForm(req, res)`: Create form definition.
- `getForm(req, res)`: Get form by subject.
- `getDailyForm(req, res)`: Get today's form (once per day).
- `getAllForms(req, res)`: List forms.
- `updateForm(req, res)`: Update form by subject.
- `deleteForm(req, res)`: Delete form by subject.
- `getFormById(req, res)`: Get form by ID.
- `updateFormById(req, res)`: Update form by ID.
- `deleteFormById(req, res)`: Delete form by ID.

### `src/controllers/response.controller.js`

- `submitFormResponse(req, res)`: Submit answers to a form.
- `getStudentStatus(req, res)`: Status overview for a student.
- `getSchoolResponsesStatistics(req, res)`: Aggregated stats for school by date range.

## Services

### `src/services/contacts.service.js`

- `createContact(data)`: Persist a contact message.
- `fetchContactsMessages()`: Retrieve messages.

### `src/services/ticket.service.js`

- `createTicket(data, file)`: Create ticket; optional file upload to Firebase Storage.
- `getTickets()`: List tickets.

### `src/services/student.service_csv.js`

- `importStudentsFromCSV(filePath)`: Import students from CSV.
- `exportStudentsToCSV(filePath)`: Export students to CSV.

### `src/services/class.service.js`

- `createClass(data)`: Create class.
- `getAllClasses()`: List classes.
- `getClassById(id)`: Fetch class.
- `updateClass(id, updateData)`: Update class.
- `deleteClass(id)`: Delete class.
- `getClassesBySchoolId(schoolId)`: List classes by school.
- `addTeacherToClass(classId, teacherId)`: Assign teacher.
- `removeTeacherFromClass(classId, teacherId)`: Unassign teacher.

### `src/services/parent.service.js`

- `addParent(data)`: Create parent.
- `getParents()`: List parents.
- `getParentById(id)`: Fetch parent.
- `updateParent(id, updateData)`: Update parent.
- `deleteParent(id)`: Delete parent.

### `src/services/super-admin.service.js`

- `createSuperAdmin(data)`: Create super admin.
- `getSuperAdminById(id)`: Get super admin.
- `updateSuperAdmin(id, data)`: Update super admin.
- `changePassword(id, oldPassword, newPassword)`: Change password.

### `src/services/school.service.js`

- `createSchool(data)`: Create school.
- `getAllSchools()`: List schools.
- `getSchoolById(id)`: Fetch school.
- `updateSchool(id, data)`: Update school.
- `deleteSchool(id)`: Delete school and related data.

### `src/services/student.service.js`

- `addStudent(data)`: Create student.
- `getStudents(req)`: List students with mapping.
- `getStudentById(id)`: Fetch student.
- `updateStudent(id, data)`: Update student.
- `deleteStudent(id)`: Delete student.
- `createStudentForImporting(data)`: Create student (import helper).
- `getStudentsByClassId(classId)`: List students by class.
- `importStudentsFromCSV(filePath)`: Import via worker.

### `src/services/teacher.service.js`

- `addTeacher(data, file)`: Create teacher (with optional file).
- `getTeachers(req)`: List teachers; mapped output.
- `getTeacherById(id)`: Fetch teacher.
- `updateTeacher(id, updateData)`: Update teacher.
- `deleteTeacher(id)`: Delete teacher.
- `getTeachersBySchoolId(schoolId)`: List by school.
- `getTeacherByClassId(classId)`: List by class.

### `src/services/response.service.js` (class instance)

- `processFormResponse(studentId, formId, answers)`: Validate and save responses.
- `calculateStatus(question, answer)`: Status from question type.
- `handleSlider(answer)`: Map slider value to status.
- `calculateTrend(studentId, questionId, currentAnswer)`: Compare with previous.
- `getStudentStatus(studentId)`: Latest response + questions.
- `getSchoolResponsesStatistics(schoolId, from, to)`: Aggregate stats across range.
- `getStatusColor(score)`: Map numeric score to color.
- `getStatusPriority(status)`: Priority ordering for statuses.

## Middleware

### `src/middleware/uploadMiddleware.js`

- `upload`: Multer instance for disk storage.
- `uploadSingle(fieldName)`: Middleware for single-file uploads.
- `uploadMultiple(fieldName, maxCount)`: Middleware for multi-file uploads.
- `deleteFile(relativePath)`: Delete one file by relative path.
- `deleteFiles(relativePaths)`: Delete multiple files.
- `uploader`: Alias to `upload`.

Notes: Validates extensions/MIME, size and count limits, structured date/type directories, and attaches `file.relativePath`.

### `src/middleware/pagination.js`

- `pagination({ defaultLimit, maxLimit, allowedFilters })`: Returns middleware that builds `req.pagination` with `page`, `limit`, `skip`, `sort`, and sanitized filters.

### `src/common/middleware/auth.js`

- `authenticateUser(req, res, next)`: JWT auth; sets `req.user`.
- `authorizeRole(allowedRoles)`: Role-based access; checks school/resource access.
- `checkAuth(req, res, next)`: Optional JWT; sets `req.user` or `null`.

### `src/common/middleware/translateMiddleware.js`

- `translateMiddleware(req, res, next)`: Set `req.lang`, configure `i18n`, attach `req.translate` helpers.

### `src/common/middleware/validation.js`

- `validate(schema, property?)`: Async validator; returns 422 with structured errors on Joi validation issues.

## Utilities

### `src/common/utils/csvParser.js`

- `csvToJson(filePath, options)`: Stream-parse CSV to JSON with validation.
- `jsonToCsv(data, filePath, options)`: Write JSON to CSV.
- `createCsvSchema(fields)`: Build JSON schema from field map.
- `createCsvStreamProcessor(processRow)`: Return streaming processor for large CSVs.

## Routers (inline helpers)

### `src/routes/blog.router.js`

- `metadata(req, res, next)`: Attach `req.meta = { type: 'blog' }`.

## Application Entry

### `index.js`

- Express app setup, MongoDB connection, static `uploads` mount, request logging, error handler, router registration, language-based routing, and server listen.

---

If you want a more detailed report (parameters, returns, and JSDoc extraction), I can extend this to parse each file for richer metadata.
