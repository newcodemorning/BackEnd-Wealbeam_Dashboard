// utils/csvParser.js
const csv = require('fast-csv');
const fs = require('fs');
const { validate } = require('jsonschema'); // Optional: npm install jsonschema

// 1. Generic CSV to JSON converter with validation
exports.csvToJson = async (filePath, {
  headers = true,
  delimiter = ',',
  dateFields = [],
  requiredFields = [],
  schema = null
} = {}) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];

    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers, delimiter }))
      .on('data', (row) => {
        try {
          // Convert date fields
          dateFields.forEach(field => {
            if (row[field]) row[field] = new Date(row[field]);
          });

          // Validate required fields
          requiredFields.forEach(field => {
            if (!row[field]) throw new Error(`Missing required field: ${field}`);
          });

          // JSON schema validation
          if (schema) {
            const validation = validate(row, schema);
            if (!validation.valid) {
              validation.errors.forEach(err => 
                errors.push(`Row ${results.length + 1}: ${err.stack}`)
              );
            }
          }

          results.push(row);
        } catch (error) {
          errors.push(`Row ${results.length + 1}: ${error.message}`);
        }
      })
      .on('end', () => {
        if (errors.length > 0) {
          reject(new Error(`CSV validation errors:\n${errors.join('\n')}`));
        } else {
          resolve(results);
        }
      })
      .on('error', reject);
  });
};

// 2. JSON to CSV formatter
exports.jsonToCsv = async (data, filePath, {
  headers = true,
  delimiter = ',',
  dateFields = []
} = {}) => {
  return new Promise((resolve, reject) => {
    const csvStream = csv.format({ headers, delimiter });
    const writableStream = fs.createWriteStream(filePath);

    csvStream.pipe(writableStream);

    data.forEach(item => {
      const formattedItem = { ...item };
      
      // Format date fields
      dateFields.forEach(field => {
        if (formattedItem[field] instanceof Date) {
          formattedItem[field] = formattedItem[field].toISOString().split('T')[0];
        }
      });

      csvStream.write(formattedItem);
    });

    csvStream.end();
    writableStream.on('finish', resolve);
    writableStream.on('error', reject);
  });
};

// 3. CSV Schema Validator
exports.createCsvSchema = (fields) => ({
  type: "object",
  properties: Object.fromEntries(
    Object.entries(fields).map(([field, type]) => [
      field,
      { 
        type: type === 'date' ? 'string' : type,
        format: type === 'date' ? 'date' : undefined
      }
    ])
  ),
  required: Object.entries(fields)
    .filter(([_, type]) => type.required)
    .map(([field]) => field)
});

// 4. Streaming CSV Processor (for large files)
exports.createCsvStreamProcessor = (processRow) => {
  return (filePath) => new Promise((resolve, reject) => {
    let rowCount = 0;

    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on('data', async (row) => {
        try {
          rowCount++;
          await processRow(row);
        } catch (error) {
          reject(new Error(`Error processing row ${rowCount}: ${error.message}`));
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
};

// 5. Helper for date validation
exports.isValidDate = (dateString) => {
  return !isNaN(Date.parse(dateString));
};

// 6. Helper for number validation
exports.isValidNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};