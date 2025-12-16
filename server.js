// server.js
const express = require('express');
const path = require('path');
const { createPool, ensureSchema } = require('./database');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// simple request logger middleware
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Validation regex (server-side)
const nameRegex = /^[A-Za-z0-9]{1,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;
const eircodeRegex = /^[0-9][A-Za-z0-9]{5}$/;

// reusable validation middleware
function validateBody(req, res, next) {
  const { first_name, second_name, email, phone, eircode } = req.body || {};
  const errors = [];

  if (!first_name || !nameRegex.test(first_name)) errors.push('Invalid first_name.');
  if (!second_name || !nameRegex.test(second_name)) errors.push('Invalid second_name.');
  if (!email || !emailRegex.test(email)) errors.push('Invalid email.');
  if (!phone || !phoneRegex.test(phone)) errors.push('Invalid phone.');
  if (!eircode || !eircodeRegex.test(eircode)) errors.push('Invalid eircode.');

  if (errors.length > 0) return res.status(400).json({ ok: false, errors });
  next();
}

// Serve form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

let pool;

// Route uses ensureSchema middleware to guarantee table exists
async function ensureSchemaMiddleware(req, res, next) {
  try {
    // ensure schema only once; if already done it's cheap
    await ensureSchema(pool);
    next();
  } catch (err) {
    console.error('Schema check/creation failed:', err);
    return res.status(500).json({ ok: false, error: 'Server schema initialization error.' });
  }
}

app.post('/submit', validateBody, ensureSchemaMiddleware, async (req, res) => {
  const { first_name, second_name, email, phone, eircode } = req.body;

  const insertSql = `INSERT INTO mysql_table (first_name, second_name, email, phone, eircode) VALUES (?, ?, ?, ?, ?)`;

  try {
    const [result] = await pool.query(insertSql, [first_name, second_name, email, phone, eircode]);
    return res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('DB insert error:', err);
    return res.status(500).json({ ok: false, error: 'Database insert error.' });
  }
});

// global error handler (last middleware)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ ok: false, error: 'Internal server error.' });
});

// start server with DB pool and proper error handling on port conflict
(async function start() {
  try {
    pool = await createPool();
    // ensure schema at startup too (this reduces first-request latency)
    await ensureSchema(pool);

    const server = app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Choose a different PORT or stop the process using it.`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });

    // Optional: graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      server.close();
      try { await pool.end(); } catch(e) {}
      process.exit(0);
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
