require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nclex_prep'
    });

    console.log('Connected to database');
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'posts' 
       AND COLUMN_NAME = 'featured'`,
      [process.env.DB_NAME || 'nclex_prep']
    );

    if (columns.length > 0) {
      console.log('Column "featured" already exists in posts table');
      return;
    }
    await connection.execute(
      `ALTER TABLE posts 
       ADD COLUMN featured BOOLEAN DEFAULT FALSE AFTER status`
    );

    console.log('Successfully added "featured" column to posts table');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();

