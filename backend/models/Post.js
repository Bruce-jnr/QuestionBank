const pool = require('../src/config/database');

class Post {
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = null,
      category = null,
      featured = null
    } = options;
    const limitInt = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const pageInt = Math.max(1, parseInt(page, 10) || 1);
    const offset = Math.max(0, (pageInt - 1) * limitInt);
    
    let query = `
      SELECT 
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p.content,
        p.category,
        p.status,
        p.featured,
        p.featured_image,
        p.published_at,
        p.created_at,
        p.updated_at,
        a.username as author_name
      FROM posts p
      LEFT JOIN admins a ON p.author_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (p.title LIKE ? OR a.username LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    if (category) {
      query += ` AND p.category = ?`;
      params.push(category);
    }

    if (featured !== null) {
      query += ` AND p.featured = ?`;
      params.push(featured ? 1 : 0);
    }
    query += ` ORDER BY p.created_at DESC LIMIT ${limitInt} OFFSET ${offset}`;

    const [posts] = await pool.execute(query, params);
    let countQuery = `
      SELECT COUNT(*) as total
      FROM posts p
      LEFT JOIN admins a ON p.author_id = a.id
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND (p.title LIKE ? OR a.username LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    if (status) {
      countQuery += ` AND p.status = ?`;
      countParams.push(status);
    }

    if (category) {
      countQuery += ` AND p.category = ?`;
      countParams.push(category);
    }

    if (featured !== null) {
      countQuery += ` AND p.featured = ?`;
      countParams.push(featured ? 1 : 0);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  static async findById(id) {
    const [posts] = await pool.execute(
      `SELECT 
        p.*,
        a.username as author_name
      FROM posts p
      LEFT JOIN admins a ON p.author_id = a.id
      WHERE p.id = ?`,
      [id]
    );
    return posts[0] || null;
  }
  static async findBySlug(slug) {
    const [posts] = await pool.execute(
      `SELECT 
        p.*,
        a.username as author_name
      FROM posts p
      LEFT JOIN admins a ON p.author_id = a.id
      WHERE p.slug = ?`,
      [slug]
    );
    return posts[0] || null;
  }
  static async create(postData) {
    const {
      title,
      slug,
      content,
      excerpt,
      category,
      author_id,
      featured_image,
      status = 'draft',
      featured = false
    } = postData;

    const published_at = status === 'published' ? new Date() : null;

    const [result] = await pool.execute(
      `INSERT INTO posts 
        (title, slug, content, excerpt, category, author_id, featured_image, status, featured, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, content, excerpt, category, author_id, featured_image, status, featured ? 1 : 0, published_at]
    );

    return result.insertId;
  }
  static async update(id, postData) {
    const {
      title,
      slug,
      content,
      excerpt,
      category,
      featured_image,
      status,
      featured
    } = postData;

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (slug !== undefined) {
      updates.push('slug = ?');
      params.push(slug);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    if (excerpt !== undefined) {
      updates.push('excerpt = ?');
      params.push(excerpt);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    if (featured_image !== undefined) {
      updates.push('featured_image = ?');
      params.push(featured_image);
    }
    if (featured !== undefined) {
      updates.push('featured = ?');
      params.push(featured ? 1 : 0);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'published') {
        updates.push('published_at = COALESCE(published_at, NOW())');
      }
    }

    if (updates.length === 0) {
      return false;
    }

    params.push(id);

    const [result] = await pool.execute(
      `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return result.affectedRows > 0;
  }
  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM posts WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
  static async slugExists(slug, excludeId = null) {
    let query = 'SELECT id FROM posts WHERE slug = ?';
    const params = [slug];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  }
  static async generateUniqueSlug(title, excludeId = null) {
    let baseSlug = this.generateSlug(title);
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.slugExists(slug, excludeId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }
  static generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = Post;

