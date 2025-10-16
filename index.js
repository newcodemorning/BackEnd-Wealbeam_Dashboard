const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const authRoutes = require('./src/routes/auth.router');
const faqsRoutes = require('./src/routes/faq.router');
const forumRoutes = require('./src/routes/forum.router');
const contactsRouter = require('./src/routes/contacts.router');
const ticketRouter = require('./src/routes/ticket.router');
const studentRouter = require('./src/routes/student.router');
const ResponseRouter = require('./src/routes/response.router');
const QuestionRouter = require('./src/routes/question.router');;
const superAdminRouter = require('./src/routes/super-admin.router')
const teacherRouter = require('./src/routes/teacher.router')
const schoolRouter = require('./src/routes/school.router')
const classRouter = require('./src/routes/class.router')
const parentRouter = require('./src/routes/parent.router')
const pdfRouter = require('./src/routes/pdf.router');
const IncidentReportRoutes = require('./src/routes/incident.routes');
const ProfileRoutes = require('./src/routes/profile.router');
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
    console.log("DB Connected");
    // Create indexes after successful connection
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
  next();
});


app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


app.get("/", (req, res) => res.send("Hello, welcome to the weallbeamtogether API! v5.7.10.2 :)"));

// Apply authentication and authorization middleware

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


// Base route
app.get('/', (req, res) => {
  res.send('Firebase Express App is running');
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
