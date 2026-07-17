const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const { rows } = await pool.query(
    "SELECT to_regclass('public.users') AS users_table"
  );

  if (rows[0].users_table) {
    console.log('Database schema is already initialized.');
    return;
  }

  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);
  console.log('Database schema initialized successfully.');
}

initDatabase()
  .catch((error) => {
    console.error('Database initialization failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
