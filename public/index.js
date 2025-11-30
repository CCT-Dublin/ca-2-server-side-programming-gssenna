const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2');

// DB connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'CA2_Server_Side'
});

// Validation regex (same rules as front-end)
const nameRegex = /^[A-Za-z0-9]{1,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;
const eircodeRegex = /^[0-9][A-Za-z0-9]{5}$/;

// Validate a full row (returns array of error messages)
function validateRow(row, rowNumber) {
  const errors = [];

  // Check presence
  if (!row.first_name) errors.push(`Row ${rowNumber}: Missing first_name`);
  if (!row.second_name) errors.push(`Row ${rowNumber}: Missing second_name`);
  if (!row.email) errors.push(`Row ${rowNumber}: Missing email`);
  if (!row.phone) errors.push(`Row ${rowNumber}: Missing phone`);
  if (!row.eircode) errors.push(`Row ${rowNumber}: Missing eircode`);

  // If any missing, return early
  if (errors.length > 0) return errors;

  // Format validations
  if (!nameRegex.test(row.first_name)) errors.push(`Row ${rowNumber}: first_name invalid (only letters/numbers, max 20).`);
  if (!nameRegex.test(row.second_name)) errors.push(`Row ${rowNumber}: second_name invalid (only letters/numbers, max 20).`);
  if (!emailRegex.test(row.email)) errors.push(`Row ${rowNumber}: email invalid format.`);
  if (!phoneRegex.test(row.phone)) errors.push(`Row ${rowNumber}: phone invalid (must be exactly 10 digits).`);
  if (!eircodeRegex.test(row.eircode)) errors.push(`Row ${rowNumber}: eircode invalid (start with number, alphanumeric, 6 chars).`);

  return errors;
}

function processCSV(filePath) {
  let rowNumber = 1; // counts data rows starting at 1
  let insertedCount = 0;
  let rejectedCount = 0;

  fs.createReadStream(filePath)
    .pipe(csv({ separator: ';' }))  // <<-- important: use semicolon separator
    .on('data', (row) => {
      const errors = validateRow(row, rowNumber);

      if (errors.length > 0) {
        errors.forEach(err => console.error(err));
        rejectedCount++;
      } else {
        // Insert valid rows (parameterized query)
        connection.query(
          'INSERT INTO mysql_table (first_name, second_name, email, phone, eircode) VALUES (?, ?, ?, ?, ?)',
          [row.first_name, row.second_name, row.email, row.phone, row.eircode],
          (err) => {
            if (err) {
              console.error(`Row ${rowNumber}: Error inserting ->`, err.message);
              rejectedCount++;
            } else {
              insertedCount++;
            }
          }
        );
      }
      rowNumber++;
    })
    .on('end', () => {
      console.log('CSV processing complete!');
      console.log(`Rows inserted: ${insertedCount}`);
      console.log(`Rows rejected: ${rejectedCount}`);
      connection.end();
    })
    .on('error', (err) => {
      console.error('Error reading CSV:', err.message);
    });
}

// Run it
processCSV('data.csv');
