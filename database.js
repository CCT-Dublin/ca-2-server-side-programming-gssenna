// database.js
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '1234',
  // do not include database here when creating DB if it may not exist yet
  multipleStatements: false,
  waitForConnections: true,
  connectionLimit: 10,
};

async function createPool() {
  // create a pool connected to the server (without database name)
  const pool = mysql.createPool({ ...DB_CONFIG, database: undefined });
  return pool;
}

async function ensureSchema(pool) {
  // Ensure database and table exist with the correct schema
  // Use parameterized queries (no string interpolation for identifiers)
  await pool.query(`CREATE DATABASE IF NOT EXISTS \`CA2_Server_Side\``);
  // ensure pool uses the database from now on
  await pool.query(`USE \`CA2_Server_Side\``);

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS mysql_table (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      second_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      eircode VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(createTableSql);
}

module.exports = {
  createPool,
  ensureSchema,
};
