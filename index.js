const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const pdfRouter = require('./src/routes/pdf.router');
const appInfo = require('./src/routes/info.router');
const faqsRoutes = require('./src/routes/faq.router');
const authRoutes = require('./src/routes/auth.router');
const classRouter = require('./src/routes/class.router')
const forumRoutes = require('./src/routes/forum.router');
const schoolRouter = require('./src/routes/school.router')
const parentRouter = require('./src/routes/parent.router')
const ticketRouter = require('./src/routes/ticket.router');
const studentRouter = require('./src/routes/student.router');
const teacherRouter = require('./src/routes/teacher.router')
const ProfileRoutes = require('./src/routes/profile.router');
const contactsRouter = require('./src/routes/contacts.router');
const ResponseRouter = require('./src/routes/response.router');
const QuestionRouter = require('./src/routes/question.router');;
const BlogRoutes = require('./src/routes/blog.router');;
const superAdminRouter = require('./src/routes/super-admin.router')
const IncidentReportRoutes = require('./src/routes/incident.routes');
const translateMiddleware = require('./src/common/middleware/translateMiddleware');
const { createIndexes } = require('./src/models/indexes');

require('dotenv').config();
const path = require('path');
const app = express();
app.use(cors());

mongoose
  .connect(process.env.MONGO_DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10
  })
  .then(async () => {
    console.log("\x1b[32mDB Connected successfully !\x1b[0m");
    await createIndexes();
  })
  .catch((err) => {
    console.log('MongoDB connection error:', err);
  });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log(`[MAIN] Content-Type: ${req.headers['content-type']}`);
  console.log(`[MAIN] Has body: ${!!req.body}`);
  console.log(`[MAIN] Body keys: ${Object.keys(req.body || {}).length}`);
  next();
});


app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


app.get("/", appInfo);
app.use("/auth", authRoutes);
app.use("/faqs", faqsRoutes);
app.use("/forum", forumRoutes);
app.use("/contacts", contactsRouter);
app.use("/ticket", ticketRouter);
app.use("/questions", QuestionRouter);
app.use("/responses", ResponseRouter);
app.use("/students", studentRouter);
app.use("/super-admin", superAdminRouter);
app.use("/teachers", teacherRouter);
app.use("/school", schoolRouter);
app.use("/classes", classRouter);
app.use("/parent", parentRouter);
app.use("/pdf", pdfRouter);
app.use("/incidents", IncidentReportRoutes);
app.use("/profile", ProfileRoutes);
app.use("/blog", BlogRoutes);



// ************** Language-based routing ************** //

const langRouter = express.Router();
app.use('/:lang', translateMiddleware, langRouter);

langRouter.use("/auth", authRoutes);
langRouter.use("/faqs", faqsRoutes);
langRouter.use("/forum", forumRoutes);
langRouter.use("/contacts", contactsRouter);
langRouter.use("/ticket", ticketRouter);
langRouter.use("/questions", QuestionRouter);
langRouter.use("/responses", ResponseRouter);
langRouter.use("/students", studentRouter);
langRouter.use("/super-admin", superAdminRouter);
langRouter.use("/teachers", teacherRouter);
langRouter.use("/school", schoolRouter);
langRouter.use("/classes", classRouter);
langRouter.use("/parent", parentRouter);
langRouter.use("/pdf", pdfRouter);
langRouter.use("/incidents", IncidentReportRoutes);
langRouter.use("/profile", ProfileRoutes);
langRouter.use("/blog", BlogRoutes);



app.get('/version', (req, res) => {
  res.json({ version: '1.0.1' });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\x1b[32mServer is running on port ${PORT}\x1b[0m`);
});
