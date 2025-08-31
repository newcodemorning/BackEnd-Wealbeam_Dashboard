# Language Translation Todo List

## Prerequisites

- [ ] Decide on the new language code (e.g., 'fr' for French, 'es' for Spanish, 'de' for German)
- [ ] Install translation tools if needed (Google Translate API, DeepL, etc.)

## 1. Core Configuration Updates

### i18n Configuration

- [ ] Update `src/config/i18n.js` - Add new language to locales array
- [ ] Update `src/Middleware/translateMiddleware.js` - Add new language to SUPPORTED_LANGUAGES array

## 2. Translation Files Creation

### Locale Files

- [ ] Create new locale file: `src/locales/[LANG_CODE].json`
- [ ] Copy structure from existing `src/locales/en.json`
- [ ] Translate all text strings to new language
- [ ] Copy structure from existing `src/locales/ar.json` for RTL reference if needed

## 3. Database Schema Updates

### Models That Need Language Support

- [ ] Review FAQ model - Already supports multilingual (question/answer objects)
- [ ] Review Student model - Check if first_name/last_name need language support
- [ ] Review any other models with text content that should be translatable

## 4. Service Layer Updates

### FAQ Service

- [ ] Test `src/services/fq.service.js` - Already handles language parameter
- [ ] Verify getAllFaqs method works with new language code
- [ ] Add fallback logic for missing translations

### Response Service

- [ ] Review `src/services/response.service.js` for any hardcoded text
- [ ] Check if error messages need translation

### Other Services

- [ ] Review all services in `src/services/` for hardcoded English text
- [ ] Replace hardcoded strings with translation keys

## 5. Controller Updates

### FAQ Controller

- [ ] Test `src/controllers/faq.controller.js` - Should work with new language
- [ ] Verify error messages are translatable

### Student Controller

- [ ] Update `src/controllers/student.controller.js` getStudentById method
- [ ] Ensure name localization works with new language

### Other Controllers

- [ ] Review all controllers for hardcoded response messages
- [ ] Replace with translation keys where appropriate

## 6. Validation Updates

### Validation Schemas

- [ ] Update `src/common/validations/faq.validator.js` - Add new language to required fields
- [ ] Review other validators for language-specific validation needs

## 7. Route Testing

### Language Routes

- [ ] Test new language routes: `GET /[LANG_CODE]/faqs/get`
- [ ] Test fallback to default language for unsupported routes
- [ ] Verify all existing endpoints work with new language parameter

## 8. Frontend Considerations

### API Responses

- [ ] Ensure all API responses include proper language-specific content
- [ ] Test language switching functionality
- [ ] Verify RTL support if adding RTL language

## 9. Database Migration

### Existing Data

- [ ] Create migration script to add new language fields to existing FAQ records
- [ ] Decide on default values for missing translations
- [ ] Plan gradual translation of existing content

## 10. Testing

### Unit Tests

- [ ] Write tests for new language support
- [ ] Test language middleware with new language code
- [ ] Test FAQ service with new language parameter

### Integration Tests

- [ ] Test complete request flow with new language
- [ ] Test error handling for missing translations
- [ ] Test fallback mechanisms

## 11. Documentation

### API Documentation

- [ ] Update API documentation to include new language support
- [ ] Document language parameter usage
- [ ] Add examples for new language endpoints

### README Updates

- [ ] Update README with supported languages list
- [ ] Add language configuration instructions

## 12. Deployment

### Environment Variables

- [ ] Add new language configuration to environment variables if needed
- [ ] Update deployment scripts to include new locale files

### Production Considerations

- [ ] Plan rollout strategy for new language
- [ ] Consider A/B testing for language detection
- [ ] Monitor performance impact of additional translations

## Implementation Priority

### Phase 1 (Core Setup)

1. Update i18n configuration
2. Create new locale file with basic translations
3. Update middleware
4. Test basic language switching

### Phase 2 (Content Translation)

1. Translate FAQ content
2. Update validation schemas
3. Add database migrations for existing content

### Phase 3 (Testing & Polish)

1. Comprehensive testing
2. Performance optimization
3. Documentation updates
4. Production deployment

## Translation Keys to Add

### Common Messages

- Success messages
- Error messages
- Validation messages
- Status messages

### FAQ Specific

- Question content
- Answer content
- Category names
- Help text

### Form Labels

- Field labels
- Button text
- Placeholder text
- Instructions

## MAIN ROUTES THAT NEED TRANSLATION

### 1. FAQ Routes (Already Multilingual)

- `GET /:lang/faqs/get` - Returns FAQs in specific language
- `GET /faqs/get/` - Returns FAQs with all languages
- `POST /faqs/add-new` - Creates FAQ with multilingual content
- `PUT /faqs/:id` - Updates FAQ with multilingual content
- `DELETE /faqs/:id` - Delete FAQ

### 2. Student Routes (Name Translation)

- `GET /:lang/students/get` - Student list with localized names
- `GET /:lang/students/:id` - Single student with localized name
- `POST /students/add` - Create student with multilingual names
- `PUT /students/:id` - Update student with multilingual names
- `GET /:lang/students/class/:classId` - Students by class with localized names

### 3. Teacher Routes (Name Translation)

- `GET /:lang/teachers/get` - Teacher list with localized names
- `GET /:lang/teachers/:id` - Single teacher with localized name
- `POST /teachers/add` - Create teacher with multilingual names
- `PUT /teachers/:id` - Update teacher with multilingual names

### 4. School Routes (Name/Address Translation)

- `GET /:lang/school/get` - School list with localized content
- `GET /:lang/school/:id` - Single school with localized content
- `POST /school/add` - Create school with multilingual content
- `PUT /school/:id` - Update school with multilingual content

### 5. Class Routes (Name/Subject Translation)

- `GET /:lang/classes/get` - Class list with localized names
- `GET /:lang/classes/:id` - Single class with localized name
- `POST /classes/add` - Create class with multilingual names
- `PUT /classes/:id` - Update class with multilingual names

### 6. Question/Form Routes (Content Translation)

- `GET /:lang/questions/forms` - Forms with localized questions
- `GET /:lang/questions/form/:subject` - Form by subject with localized content
- `POST /questions/form` - Create form with multilingual questions
- `PUT /questions/form/:subject` - Update form with multilingual questions

### 7. Response Routes (Status Messages Translation)

- `POST /:lang/responses/submit` - Submit response with localized feedback
- `GET /:lang/responses/student/:studentId` - Student responses with localized status

### 8. Forum Routes (Content Translation)

- `GET /:lang/forum/posts` - Posts with localized content
- `POST /:lang/forum/posts` - Create post with multilingual content
- `GET /:lang/forum/posts/:postId` - Single post with localized content
- `POST /:lang/forum/posts/:postId/replies` - Add reply with multilingual content

## DATABASE TABLES/MODELS THAT NEED TRANSLATION

### 1. FAQ Model (Already Multilingual) ✅

```javascript
{
  question: { ar: String, en: String, fr: String },
  answer: { ar: String, en: String, fr: String }
}
```

### 2. Student Model (Needs Name Translation)

```javascript
{
  first_name: { ar: String, en: String, fr: String },
  last_name: { ar: String, en: String, fr: String },
  // Current: first_name: String, last_name: String
}
```

### 3. Teacher Model (Needs Name Translation)

```javascript
{
  first_name: { ar: String, en: String, fr: String },
  last_name: { ar: String, en: String, fr: String }
}
```

### 4. School Model (Needs Translation)

```javascript
{
  name: { ar: String, en: String, fr: String },
  address: { ar: String, en: String, fr: String },
  description: { ar: String, en: String, fr: String }
}
```

### 5. Class Model (Needs Translation)

```javascript
{
  name: { ar: String, en: String, fr: String },
  Subject: { ar: String, en: String, fr: String }
}
```

### 6. Question/Form Model (Needs Translation)

```javascript
{
  title: { ar: String, en: String, fr: String },
  description: { ar: String, en: String, fr: String },
  questions: [{
    text: { ar: String, en: String, fr: String },
    options: [{
      text: { ar: String, en: String, fr: String },
      name: { ar: String, en: String, fr: String }
    }]
  }]
}
```

### 7. Forum Model (Needs Translation)

```javascript
{
  content: { ar: String, en: String, fr: String },
  category: { ar: String, en: String, fr: String },
  replies: [{
    content: { ar: String, en: String, fr: String }
  }]
}
```

### 8. Parent Model (Needs Name Translation)

```javascript
{
  first_name: { ar: String, en: String, fr: String },
  last_name: { ar: String, en: String, fr: String }
}
```

## VALIDATION SCHEMAS TO UPDATE

### 1. FAQ Validator ✅ (Already Updated)

- `src/common/validations/faq.validator.js`

### 2. Student Validator (Needs Update)

- Add multilingual validation for names
- `first_name: { ar: required, en: required, fr: required }`

### 3. Teacher Validator (Needs Update)

- Add multilingual validation for names

### 4. School Validator (Needs Update)

- Add multilingual validation for name/address

### 5. Class Validator (Needs Update)

- Add multilingual validation for name/subject

### 6. Question Validator (Needs Update)

- Add multilingual validation for form content

### 7. Forum Validator (Needs Update)

- Add multilingual validation for posts/replies

## SERVICES TO UPDATE

### 1. FAQ Service ✅ (Already Handles Language)

- `src/services/fq.service.js`

### 2. Student Service (Needs Language Support)

- `getStudents()` - Return names in requested language
- `getStudentById()` - Return name in requested language
- `addStudent()` - Accept multilingual names
- `updateStudent()` - Update multilingual names

### 3. Teacher Service (Needs Language Support)

- Similar to Student Service for names

### 4. School Service (Needs Language Support)

- Handle multilingual school information

### 5. Class Service (Needs Language Support)

- Handle multilingual class names/subjects

### 6. Question Service (Needs Language Support)

- Handle multilingual form content

### 7. Forum Service (Needs Language Support)

- Handle multilingual posts/replies

## ERROR MESSAGES TO TRANSLATE

### Common Error Messages

- "Not found"
- "Invalid input"
- "Access denied"
- "Server error"
- "Validation failed"

### Model-Specific Errors

- "Student not found"
- "Teacher not found"
- "School not found"
- "Class not found"
- "Form not found"
- "FAQ not found"

## SUCCESS MESSAGES TO TRANSLATE

### CRUD Operations

- "Created successfully"
- "Updated successfully"
- "Deleted successfully"
- "Retrieved successfully"

### Import/Export Operations

- "Import completed successfully"
- "Export completed successfully"
- "Import completed with errors"

## STATUS/RESPONSE MESSAGES TO TRANSLATE

### Response Status

- "green", "yellow", "red" status indicators
- "improving", "worsening", "stable" trends
- Form submission feedback messages

## Notes

- Consider using professional translation services for important content
- Implement translation memory to maintain consistency
- Plan for regular translation updates
- Consider cultural adaptation, not just literal translation
