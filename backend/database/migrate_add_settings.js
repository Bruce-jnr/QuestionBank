require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nclex_prep',
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to database');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(255) NOT NULL UNIQUE,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'string',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    const defaultSettings = [
      ['site_name', 'NCLEX Review Academy', 'string', 'Site name displayed in header and title'],
      ['site_description', 'Your trusted resource for NCLEX exam preparation', 'string', 'Site description for SEO'],
      ['contact_email', 'admin@nclexprep.com', 'string', 'Contact email address'],
      ['posts_per_page', '10', 'number', 'Number of posts to display per page'],
      ['comments_enabled', 'true', 'boolean', 'Enable or disable comments on posts'],
      ['comments_auto_approve', 'false', 'boolean', 'Automatically approve comments without moderation'],
      ['default_post_status', 'draft', 'string', 'Default status for new posts'],
      ['default_theme', 'light', 'string', 'Default theme (light or dark)']
    ];

    for (const [key, value, type, description] of defaultSettings) {
      await connection.execute(`
        INSERT INTO settings (setting_key, setting_value, setting_type, description)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          setting_value = VALUES(setting_value),
          setting_type = VALUES(setting_type),
          description = VALUES(description)
      `, [key, value, type, description]);
    }

    console.log('Settings table created and default settings inserted');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

migrate();

