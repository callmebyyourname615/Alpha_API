require('dotenv').config();

const { Client } = require('pg');

const database = process.env.DB_NAME;

if (!database) {
  throw new Error('DB_NAME is required. Copy .env.example to .env and set the database values.');
}

const quoteIdentifier = (value) => `"${value.replace(/"/g, '""')}"`;

async function main() {
  // PostgreSQL must be connected to an existing database before it can create
  // the application database. Override DB_ADMIN_DATABASE only when needed.
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_ADMIN_DATABASE ?? 'postgres',
  });

  await client.connect();
  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (existing.rowCount) {
      console.log(`Database ${database} already exists.`);
      return;
    }

    await client.query(`CREATE DATABASE ${quoteIdentifier(database)}`);
    console.log(`Database ${database} created.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Unable to create database: ${error.message}`);
  process.exitCode = 1;
});
