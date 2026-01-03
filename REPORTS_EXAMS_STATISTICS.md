# Reports, Exams, Questions, and Statistics — WeAllBeam Deep Dive

Date: 2026-01-02

This document explains how the application models and processes exams (forms/questions), submissions (responses), and reporting/statistics. It maps the domain to code (controllers, services, models, middlewares, and routes), detailing data structures, validation, access control, and result computation.

## Overview

- Exams are implemented as multilingual Forms with ordered Questions.
- Submissions are stored as Responses, attached to a `student` and a `form` with per-question status/trend computed.
- Daily exam is a special Form (`subject = 'daily'`). Students may submit once per day (enforced in controller UI logic; soft-checked in code).
- School-wide statistics aggregate Responses across date ranges for the daily form.
- Reports also include downloadable PDFs with visibility and audience targeting.
- Incidents are a separate reporting channel (not tied to exams), used for behavior/safety reporting.

---

## Forms and Questions ("Exams")

- File: `src/models/question.model.js`
- Service: `src/services/question.service.js`
- Controller: `src/controllers/question.controller.js`
- Routes: `src/routes/question.router.js`
- Validation: `src/common/validations/question.validator.js`

### Data Model

- `Form`

  - `subject`: unique string (e.g., `daily`). No spaces allowed when creating.
  - `questions`: array of `Question` (ordered, sequential `order` starting at 1).
  - Timestamps: `createdAt`, `updatedAt`.

- `Question`
  - `text`: multilingual object `{ ar: string, en: string }`.
  - `type`: one of `slider | yesno | dropdown | radiobutton`.
  - `order`: numeric (1..N), sequential across the form.
  - `dangerAnswer`: required only for `yesno` type; string that signals danger.
  - `options`: for `dropdown`/`radiobutton` only; min 2 items. Each option:
    - `text`: multilingual `{ ar, en }`.
    - `name`: multilingual `{ ar, en }` (optional).
    - `isDanger`: boolean; marks option as dangerous.

### Core Behaviors

- Create a form (`POST /questions`):

  - Requires roles: `super-admin`, `school`.
  - Validated by Joi (`createFormSchema`).
  - Checks: unique subject, no spaces, at least one question, strict sequential `order` (1..N).

- Read forms:

  - `GET /questions`: list all (roles: `super-admin`, `school`, `teacher`, `student`).
  - `GET /questions/daily`: fetch daily form (localized text via `lang` middleware).
  - `GET /questions/:subject`: get by subject (localized fields).
  - `GET /questions/id/:id`: get by id (localized fields).

- Update forms:

  - `PUT /questions/:subject` and `PUT /questions/id/:id` (roles: `super-admin`, `school`).
  - Validates sequential `order` if `questions` updated.

- Delete forms:
  - `DELETE /questions/:subject` and `DELETE /questions/id/:id` (roles: `super-admin`, `school`).

### Localization

- `QuestionService._localize(field, lang)`: returns string from multilingual field.
- `translateMiddleware` sets `req.lang` and `i18n` locale; routes under `/:lang/...` use this for localized retrieval.

---

## Responses (Submissions)

- File: `src/models/response.model.js`
- Service: `src/services/response.service.js`
- Controller: `src/controllers/response.controller.js`
- Routes: `src/routes/response.router.js`
- Validation: `src/common/validations/response.validator.js`

### Data Model

- `Response`
  - `student`: ObjectId → `Student`.
  - `form`: ObjectId → `Form`.
  - `answers`: array of `{ question: { id, text, type }, answer: string, status: 'green'|'yellow'|'red', trend?: 'improving'|'worsening'|'stable'|'changed' }`.
  - `timestamp`: date of submission (default `Date.now`).

### Submission Flow

- Endpoint: `POST /responses/submit`

  - Roles: `student` only.
  - Body: `{ form: <formId>, answers: [ { question: { id, text, type }, answer } ] }`.
  - Joi validation (`responseSchema`) ensures required shape.
  - Additional validator `validateFormResponse` checks:
    - Form exists.
    - All form question IDs are included once; prevents missing/extra questions.

- Processing: `ResponseService.processFormResponse(studentId, formId, answers)`

  - Loads `Form`; builds map of questions by id.
  - For each answer:
    - Verifies question exists and type matches.
    - Computes `status`:
      - `slider`: `<=6` → green, `<=7` → yellow, else red.
      - `yesno`: compares normalized answer with `dangerAnswer` → red if matches.
      - `dropdown`/`radiobutton`: finds selected option by matching `text` or `name` (case-insensitive); `isDanger` → red.
      - Default: green.
    - If slider, computes `trend` via last previous answer for the same question: `worsening | improving | stable | changed`.
  - Creates `Response` document with `answers` and current `timestamp`.

- Daily submission check
  - `response.controller` soft-checks last submission date and returns `208` (Already Reported) if submitted today.
  - Service includes commented-out enforcement; currently not throwing errors at service level.

### Student Status

- Endpoint: `GET /responses/student-status/:studentId`
  - Roles: `super-admin`, `school`, `teacher`, `parent`.
  - Returns latest response and the question set for the student's class subject.
  - Service: `getStudentStatus(studentId)`
    - Ensures student exists and is assigned to a class.
    - Loads `Question`s for the class `Subject` (ordered).
    - Loads latest `Response` for the student.
    - Returns `{ student, subject, questions: [...], lastResponse: { timestamp, answers } | null }`.

### School Statistics

- Endpoint: `GET /responses/:id?fromDay=YYYY-MM-DD&toDay=YYYY-MM-DD`
  - `:id` is `schoolId`.
  - Roles: `super-admin`, `school`, `teacher`, `parent`.
  - Service: `getDailySchoolResponsesStatistics(schoolId, from, to)`
    - Finds classes for school (with names), then students in those classes.
    - Validates date range.
    - Pulls responses for the daily form only (by finding form with `subject = 'daily'`).
    - Aggregates per question:
      - `text`: multilingual question text `{ ar, en }`.
      - `type`: question type.
      - `distribution`: frequency map of answers.
      - `overallAverage`: for slider questions, weighted average; otherwise, 0.
    - Aggregates per class:
      - `classId`: the class ObjectId.
      - `className`: the class name.
      - `studentsCount`: number of students in the class.
      - `average`: class average (slider questions only).
      - `riskRate`: count of at-risk students (red status or absent).
      - `status`: overall class status (red if >50% at risk).
    - Computes `totalResponses` and `totalAverage` (across slider values only).
    - Returns detailed breakdown including `dailyOverview`, `questionsTrend`, `classesOverview`, and `riskAlerts`.

### Status Utilities

- `getStatusColor(score)`: slider score → `green | yellow | red`.
- `getStatusPriority(status)`: `red=3, yellow=2, green=1` for ordering.

---

## Reports — PDFs

- Files: `src/controllers/pdf.controller.js`, `src/services/pdf.service.js`, `src/models/pdf.model.js`
- Routes: `src/routes/pdf.router.js` (not shown here; controller functions map accordingly)

### Purpose

- Host downloadable and visible PDF reports/resources targeted by language and audience (public or specific schools).

### Data Model

- `PDF`
  - `title`, `description`: multilingual (migration supports string → object).
  - `fileName`, `filePath`, `coverImage`.
  - `supportedLanguages`: `['en','ar','fr','es','de']`.
  - `targetSchools`: audience targeting (Array<ObjectId> `School`).
  - `isPublic`, `isVisible`, `viewCount`, `uploadedBy`, `uploadedAt`.

### Core Endpoints

- Upload: `POST /pdf` (requires auth + file upload via Multer `upload.fields`) → `uploadPDF`

  - Accepts: `pdf` (required), `coverImage` (optional) + metadata.
  - Normalizes multilingual title/description and flags.

- List: `GET /pdf` → `getAllPDFs`

  - Pagination and filter support (search, category-like fields via `pagination.js`).
  - Role-aware visibility: students/parents see public or targeted-to-school PDFs.

- Dashboard list: `GET /pdf/admin` → `getAllPDFsForDashboard`

  - Administrative listing without public/visibility constraints.

- Download: `GET /pdf/download/:id` → `downloadPDF`

  - Resolves absolute file path in `uploads` (or production path) and streams file.

- Update: `PUT /pdf/:id` → `updatePDF`

  - Updates multilingual fields, visibility flags, and optionally replaces files.

- Get By ID (admin/public/dashboard variants): `getPDFForAdminById`, `getPDFByIdPublic`, `getPDFByIdForDashboard`.

- Delete: `DELETE /pdf/:id` → `deletePDF`.

### Filters Metadata

- `getFilterOptions()`: distinct values for `supportedLanguages`, `targetSchools`, `uploaders` and simple option lists.

---

## Incident Reports

- File: `src/controllers/incident.controller.js`
- Service: `src/services/incident.service.js` (not enumerated above, but controller uses it)

### Purpose

- Submit and manage incident reports (safety/behavior) separate from exams/responses.

### Endpoints

- `POST /incidents` → `createIncident`

  - Requires `req.user.id` (reporter).
  - Persists incident via service.

- `GET /incidents/student/:studentId` → `getStudentIncidents`

- `GET /incidents/:incidentId` → `getIncident`

- `PUT /incidents/:incidentId` → `updateIncident`

- `DELETE /incidents/:incidentId` → `deleteIncident`

---

## Access Control and Localization

- Auth middleware: `authenticateUser`, `authorizeRole`, `checkAuth` guard routes.
- Role scopes:
  - Forms: `super-admin`/`school` create/update/delete; others read.
  - Responses: submit as `student`; statistics/status visible to staff/parents.
  - PDFs: visibility and public/private constraints applied per role.
- Language routing: all main routers supported under `/:lang/...`; `translateMiddleware` sets `req.lang` and `i18n` locale.

---

## Example Payloads

- Create Form

```json
{
  "subject": "daily",
  "questions": [
    {
      "text": { "en": "How do you feel?", "ar": "كيف تشعر؟" },
      "type": "slider",
      "order": 1
    },
    {
      "text": { "en": "Did you sleep well?", "ar": "هل نمت جيداً؟" },
      "type": "yesno",
      "order": 2,
      "dangerAnswer": "no"
    },
    {
      "text": { "en": "Choose status", "ar": "اختر الحالة" },
      "type": "dropdown",
      "order": 3,
      "options": [
        {
          "text": { "en": "Happy", "ar": "سعيد" },
          "name": { "en": "happy", "ar": "سعيد" },
          "isDanger": false
        },
        {
          "text": { "en": "Sad", "ar": "حزين" },
          "name": { "en": "sad", "ar": "حزين" },
          "isDanger": true
        }
      ]
    }
  ]
}
```

- Submit Response

```json
{
  "form": "<formId>",
  "answers": [
    {
      "question": {
        "id": "<q1>",
        "text": "How do you feel?",
        "type": "slider"
      },
      "answer": "7"
    },
    {
      "question": {
        "id": "<q2>",
        "text": "Did you sleep well?",
        "type": "yesno"
      },
      "answer": "yes"
    },
    {
      "question": { "id": "<q3>", "text": "Choose status", "type": "dropdown" },
      "answer": "sad"
    }
  ]
}
```

---

## Notes and Recommendations

- If enforcing single daily submission strictly, uncomment and enable the check in `ResponseService` (currently soft-enforced in controller).
- For option matching in dropdown/radiobutton, ensure frontend sends `answer` consistently (prefer `name` canonical values) to avoid localization mismatches.
- Consider storing numeric answers for sliders (`Number`) to avoid repeated parsing.
- For statistics, extend aggregation to include per-class/per-grade breakdown and trend over time.

---

If you want, I can cross-link these endpoints in OpenAPI format or generate Postman tests for responses and statistics flows.
