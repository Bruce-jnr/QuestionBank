const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  let connection;

  try {
    console.log('Setting up database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      multipleStatements: true,
    });

    console.log('Connected to MySQL server');

    const dbName = process.env.DB_NAME || 'nclex_prep';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database '${dbName}' created or already exists`);
    await connection.query(`USE \`${dbName}\``);
    console.log(`Using database '${dbName}'`);
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const schemaWithoutDb = schema
      .replace(/CREATE DATABASE.*?;/gi, '')
      .replace(/USE.*?;/gi, '')
      .trim();

    if (schemaWithoutDb) {
      await connection.query(schemaWithoutDb);
      console.log('Database schema executed successfully');
    }

    await connection.end();
    console.log('Database setup completed!');
    console.log(
      '\n Next step: Run "npm run seed" to create the default admin user',
    );
  } catch (error) {
    console.error('Error setting up database:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

setupDatabase();
