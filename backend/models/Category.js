const pool = require('../src/config/database');

class Category {
  static async findAll() {
    const [categories] = await pool.execute(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    return categories;
  }
  static async findById(id) {
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    return categories[0] || null;
  }
  static async findByName(name) {
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE name = ?',
      [name]
    );
    return categories[0] || null;
  }
  static async create(categoryData) {
    const { name, slug, description } = categoryData;
    const finalSlug = slug || this.generateSlug(name);

    const [result] = await pool.execute(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [name, finalSlug, description || null]
    );

    return result.insertId;
  }
  static async update(id, categoryData) {
    const { name, slug, description } = categoryData;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (slug !== undefined) {
      updates.push('slug = ?');
      params.push(slug);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (updates.length === 0) {
      return false;
    }

    params.push(id);

    const [result] = await pool.execute(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return result.affectedRows > 0;
  }
  static async delete(id) {
    const [posts] = await pool.execute(
      'SELECT COUNT(*) as count FROM posts WHERE category = (SELECT name FROM categories WHERE id = ?)',
      [id]
    );

    if (posts[0].count > 0) {
      throw new Error('Cannot delete category that is in use by posts');
    }

    const [result] = await pool.execute(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
  static generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = Category;

