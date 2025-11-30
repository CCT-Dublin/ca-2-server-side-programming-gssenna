//Express server that serves the form and inserts validated data into MySQL.

const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = 3000;

// Parse form bodies for regular HTML form submission
app.use(express.urlencoded({ extended: true }));

// Parse JSON bodies 
app.use(express.json());

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Serve the form at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// MySQL connection settings
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234', 
  database: 'CA2_Server_Side'
});

// Try to connect so we see DB errors early
connection.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err.message);
  } else {
    console.log('Connected to MySQL database:', connection.config.database);
  }
});

// Validation regex
const nameRegex = /^[A-Za-z0-9]{1,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;
const eircodeRegex = /^[0-9][A-Za-z0-9]{5}$/;

// POST route to receive form data
app.post('/submit', (req, res) => {
  // for form submissions 
  const { first_name, second_name, email, phone, eircode } = req.body || {};
  const errors = [];

  if (!first_name || !nameRegex.test(first_name)) errors.push('Invalid first_name.');
  if (!second_name || !nameRegex.test(second_name)) errors.push('Invalid second_name.');
  if (!email || !emailRegex.test(email)) errors.push('Invalid email.');
  if (!phone || !phoneRegex.test(phone)) errors.push('Invalid phone.');
  if (!eircode || !eircodeRegex.test(eircode)) errors.push('Invalid eircode.');

  if (errors.length > 0) {
    // If request came from a browser form, redirect with errors:
    // return errors
    return res.status(400).json({ ok: false, errors });
  }

  const sql = `
    INSERT INTO mysql_table (first_name, second_name, email, phone, eircode)
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.query(sql, [first_name, second_name, email, phone, eircode], (err) => {
    if (err) {
      console.error('DB insert error:', err.message);
      return res.status(500).json({ ok: false, error: 'Database insert error.' });
    }
    return res.json({ ok: true, message: 'Record inserted successfully!' });
  });
});

//link to server running at port 3000
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
