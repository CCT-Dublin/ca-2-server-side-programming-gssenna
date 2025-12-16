// index.js
// CSV processor that validates and inserts rows into mysql_table using the pool from database.js

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createPool, ensureSchema } = require('../database');

// --- Validation regex (same as front-end / server) ---
const nameRegex = /^[A-Za-z0-9]{1,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;
const eircodeRegex = /^[0-9][A-Za-z0-9]{5}$/;

// Validate a CSV row (returns an array of errors; empty array = valid)
function validateRow(row, rowNumber) {
  const errors = [];

  // Field presence
  if (!row.first_name) errors.push(`Row ${rowNumber}: Missing first_name`);
  if (!row.second_name) errors.push(`Row ${rowNumber}: Missing second_name`);
  if (!row.email) errors.push(`Row ${rowNumber}: Missing email`);
  if (!row.phone) errors.push(`Row ${rowNumber}: Missing phone`);
  if (!row.eircode) errors.push(`Row ${rowNumber}: Missing eircode`);

  // If anything is missing, return immediately
  if (errors.length > 0) return errors;

  // Field format
  if (!nameRegex.test(row.first_name)) errors.push(`Row ${rowNumber}: Invalid first_name (letters/numbers only, max 20).`);
  if (!nameRegex.test(row.second_name)) errors.push(`Row ${rowNumber}: Invalid second_name (letters/numbers only, max 20).`);
  if (!emailRegex.test(row.email)) errors.push(`Row ${rowNumber}: Invalid email format.`);
  if (!phoneRegex.test(row.phone)) errors.push(`Row ${rowNumber}: Invalid phone (must contain exactly 10 digits).`);
  if (!eircodeRegex.test(row.eircode)) errors.push(`Row ${rowNumber}: Invalid eircode (must start with number, alphanumeric, 6 chars).`);

  return errors;
}

async function processCSV(filePath) {
  // Create pool and ensure schema is correct before inserting anything
  const pool = await createPool();
  try {
    await ensureSchema(pool);
  } catch (err) {
    console.error('Failed to ensure DB schema:', err);
    await pool.end();
    return;
  }

  const rows = [];
  const absolutePath = path.resolve(filePath);

  // Read CSV into memory (fine for small/medium files)
  await new Promise((resolve, reject) => {
    fs.createReadStream(absolutePath)
      .pipe(csv({ separator: ';' })) // semicolon delimiter
      .on('data', (data) => {
        // Trim spaces
        for (const k of Object.keys(data)) {
          if (typeof data[k] === 'string') data[k] = data[k].trim();
        }
        rows.push(data);
      })
      .on('end', () => {
        console.log(`CSV read completed. ${rows.length} rows loaded.`);
        resolve();
      })
      .on('error', (err) => {
        console.error('Error reading CSV:', err.message);
        reject(err);
      });
  });

  // Process each row sequentially
  let insertedCount = 0;
  let rejectedCount = 0;
  let rowNumber = 1;

  for (const row of rows) {
    const errors = validateRow(row, rowNumber);

    if (errors.length > 0) {
      errors.forEach(e => console.error(e));
      rejectedCount++;
      rowNumber++;
      continue;
    }

    // Parameterized insert query
    const insertSql =
      'INSERT INTO mysql_table (first_name, second_name, email, phone, eircode) VALUES (?, ?, ?, ?, ?)';

    try {
      await pool.query(insertSql, [
        row.first_name,
        row.second_name,
        row.email,
        row.phone,
        row.eircode
      ]);
      insertedCount++;
    } catch (err) {
      console.error(`Row ${rowNumber}: Error inserting ->`, err.message);
      rejectedCount++;
    }

    rowNumber++;
  }

  console.log('CSV processing complete!');
  console.log(`Rows inserted: ${insertedCount}`);
  console.log(`Rows rejected: ${rejectedCount}`);

  // Close pool
  try {
    await pool.end();
  } catch (err) {
    console.warn('Error closing pool:', err.message);
  }
}

// Run directly from command line
if (require.main === module) {
  const csvFile = process.argv[2] || 'data.csv';
  processCSV(csvFile).catch(err => {
    console.error('Unexpected error during CSV processing:', err);
    process.exit(1);
  });
}

module.exports = { processCSV };
