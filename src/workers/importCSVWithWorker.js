const { parentPort } = require('worker_threads');
const { parse } = require('csv-parse/sync');
const mongoose = require('mongoose');
const { createStudentForImporting } = require('../services/student.service');

// MongoDB connection setup for worker
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://admin:7JEphJ21g3cv3Ugi@cluster0.e3tdn.mongodb.net/renda-app?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[Worker] MongoDB connected successfully');
  } catch (error) {
    console.error('[Worker] MongoDB connection error:', error);
    throw error;
  }
};

parentPort.on('message', async (fileBuffer) => {
  console.log('Worker received fileBuffer with length:', fileBuffer.length);
  const results = [];
  const errors = [];
  let processedCount = 0;

  try {
    // Connect to MongoDB first
    await connectDB();
    console.log('[Worker] Starting CSV import process...');

    // Try to detect and handle different encodings
    let csvString;
    try {
      // First try UTF-8
      csvString = fileBuffer.toString('utf8');
      // Check if the string contains ASCII codes (numbers separated by commas)
      if (/^\d+(,\d+)*$/.test(csvString.trim())) {
        console.log('[Worker] Detected ASCII codes, converting to string...');
        // Convert ASCII codes to actual string
        csvString = csvString.split(',')
          .map(code => String.fromCharCode(parseInt(code)))
          .join('');
      }
    } catch (e) {
      // If UTF-8 fails, try other encodings
      console.log('[Worker] UTF-8 failed, trying other encodings...');
      csvString = fileBuffer.toString('latin1');
    }

    console.log('[Worker] Starting CSV import...');
    console.log('[Worker] CSV string length:', csvString.length);
    console.log('[Worker] First 100 chars of CSV:', csvString.substring(0, 100));

    const csvData = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
      delimiter: [',', ';', '\t'],
      skip_records_with_empty_values: true,
      from_line: 1
    });

    console.log('[Worker] CSV parsed successfully. Number of rows:', csvData.length);
    if (csvData.length > 0) {
      console.log('[Worker] First row sample:', JSON.stringify(csvData[0], null, 2));
      console.log('[Worker] Available columns:', Object.keys(csvData[0]));
    } else {
      console.log('[Worker] WARNING: No rows found in CSV data');
      console.log('[Worker] Raw CSV content:', csvString.substring(0, 500));
    }

    for (const [index, row] of csvData.entries()) {
      console.log(`[Worker] Processing row ${index + 1}/${csvData.length}`);
      try {
        console.log(`[Worker] Row ${index + 1} data:`, JSON.stringify(row, null, 2));
        const student = await createStudentForImporting(row);
        // Convert Mongoose document to plain object
        const plainStudent = student.toObject();
        console.log(`[Worker] Successfully created student for row ${index + 1}:`, plainStudent._id);
        results.push(plainStudent);
      } catch (error) {
        console.error(`[Worker] Error processing row ${index + 1}:`, error.message);
        errors.push({ 
          row: JSON.parse(JSON.stringify(row)), // Ensure row is also a plain object
          error: error.message 
        });
      }
    }

    console.log('[Worker] Import completed. Results:', {
      totalRows: csvData.length,
      successfulImports: results.length,
      errors: errors.length
    });

    // Close MongoDB connection before sending results
    await mongoose.connection.close();
    console.log('[Worker] MongoDB connection closed');

    // Send plain objects through the message channel
    parentPort.postMessage({ 
      results: results.map(student => ({
        _id: student._id.toString(),
        first_name: student.first_name,
        last_name: student.last_name,
        first_email: student.first_email,
        first_phone: student.first_phone,
        class: student.class?.toString(),
        school: student.school?.toString(),
        parent: student.parent?.toString(),
        gender: student.gender,
        date_of_birth: student.date_of_birth,
        photo: student.photo
      })),
      errors: errors
    });
    console.log('[Worker] CSV import completed successfully');
  } catch (error) {
    console.error('[Worker] CSV parsing error:', error);
    // Make sure to close MongoDB connection even if there's an error
    try {
      await mongoose.connection.close();
      console.log('[Worker] MongoDB connection closed after error');
    } catch (closeError) {
      console.error('[Worker] Error closing MongoDB connection:', closeError);
    }
    parentPort.postMessage({ error: error.message || 'Unknown error occurred' });
  }
});

