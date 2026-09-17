const pool = require('../src/config/database');

class Admin {
  static async findByUsername(username) {
    const [users] = await pool.execute(
      'SELECT id, username, password, email FROM admins WHERE username = ?',
      [username]
    );
    return users[0] || null;
  }
  static async findById(id) {
    const [users] = await pool.execute(
      'SELECT id, username, email FROM admins WHERE id = ?',
      [id]
    );
    return users[0] || null;
  }
  static async create(username, password, email = null) {
    const [result] = await pool.execute(
      'INSERT INTO admins (username, password, email) VALUES (?, ?, ?)',
      [username, password, email]
    );
    return result.insertId;
  }
  static async updatePassword(id, hashedPassword) {
    await pool.execute(
      'UPDATE admins SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
  }
  static async updateEmail(id, email) {
    await pool.execute(
      'UPDATE admins SET email = ? WHERE id = ?',
      [email, id]
    );
  }
}

module.exports = Admin;

