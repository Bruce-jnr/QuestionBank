const pool = require('../src/config/database');

class Comment {
  static async findByPostId(postId, options = {}) {
    const { includeReplies = true, status = 'approved' } = options;
    
    let query = `
      SELECT 
        c.id,
        c.post_id,
        c.parent_id,
        c.author_name,
        c.author_email,
        c.content,
        c.upvotes,
        c.status,
        c.created_at,
        c.updated_at
      FROM comments c
      WHERE c.post_id = ?
    `;
    
    const params = [postId];
    
    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }
    
    if (!includeReplies) {
      query += ` AND c.parent_id IS NULL`;
    }
    
    query += ` ORDER BY c.created_at ASC`;
    
    const [comments] = await pool.execute(query, params);
    return comments;
  }
  static async findById(id) {
    const [comments] = await pool.execute(
      `SELECT 
        c.id,
        c.post_id,
        c.parent_id,
        c.author_name,
        c.author_email,
        c.content,
        c.upvotes,
        c.status,
        c.created_at,
        c.updated_at
      FROM comments c
      WHERE c.id = ?`,
      [id]
    );
    
    return comments.length > 0 ? comments[0] : null;
  }
  static async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      status = null,
      postId = null 
    } = options;
    const limitInt = parseInt(limit, 10);
    const pageInt = parseInt(page, 10);
    const offset = (pageInt - 1) * limitInt;
    
    let query = `
      SELECT 
        c.id,
        c.post_id,
        c.parent_id,
        c.author_name,
        c.author_email,
        c.content,
        c.upvotes,
        c.status,
        c.created_at,
        c.updated_at,
        p.title as post_title,
        p.slug as post_slug
      FROM comments c
      LEFT JOIN posts p ON c.post_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }
    
    if (postId) {
      query += ` AND c.post_id = ?`;
      params.push(parseInt(postId, 10));
    }
    query += ` ORDER BY c.created_at DESC LIMIT ${limitInt} OFFSET ${offset}`;
    
    const [comments] = await pool.execute(query, params);
    let countQuery = `SELECT COUNT(*) as total FROM comments WHERE 1=1`;
    const countParams = [];
    
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    
    if (postId) {
      countQuery += ` AND post_id = ?`;
      countParams.push(parseInt(postId, 10));
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    return {
      comments,
      pagination: {
        page: pageInt,
        limit: limitInt,
        total,
        totalPages: Math.ceil(total / limitInt)
      }
    };
  }
  static async create(commentData) {
    const { post_id, parent_id, author_name, author_email, content } = commentData;
    
    const [result] = await pool.execute(
      `INSERT INTO comments (post_id, parent_id, author_name, author_email, content, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [post_id, parent_id || null, author_name, author_email || null, content]
    );
    
    return this.findById(result.insertId);
  }
  static async update(id, updateData) {
    const allowedFields = ['content', 'status', 'upvotes'];
    const updates = [];
    const values = [];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    }
    
    if (updates.length === 0) {
      return this.findById(id);
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE comments SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.findById(id);
  }
  static async delete(id) {
    await pool.execute('DELETE FROM comments WHERE id = ?', [id]);
    return true;
  }
  static async upvote(id) {
    await pool.execute(
      'UPDATE comments SET upvotes = upvotes + 1 WHERE id = ?',
      [id]
    );
    return this.findById(id);
  }
}

module.exports = Comment;

