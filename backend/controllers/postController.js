const Post = require('../models/Post');
const { authenticateToken } = require('../middleware/auth');
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}
async function getPosts(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || null;
    if (isNaN(page) || page < 1) {
      return sendJSON(res, 400, { error: 'Invalid page number' });
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return sendJSON(res, 400, { error: 'Invalid limit (must be between 1 and 100)' });
    }

    const result = await Post.findAll({ page, limit, search, status });
    sendJSON(res, 200, result);
  } catch (error) {
    console.error('Error fetching posts:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function getPost(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const id = parseInt(pathParts[pathParts.length - 1]);

    if (!id || isNaN(id)) {
      return sendJSON(res, 400, { error: 'Invalid post ID' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return sendJSON(res, 404, { error: 'Post not found' });
    }

    sendJSON(res, 200, { post });
  } catch (error) {
    console.error('Error fetching post:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function createPost(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return sendJSON(res, 401, { error: 'Authentication required' });
    }

    const { verifyToken } = require('../src/config/auth');
    const decoded = verifyToken(token);
    if (!decoded) {
      return sendJSON(res, 403, { error: 'Invalid or expired token' });
    }

    const body = await parseBody(req);
    const { title, content, excerpt, category, featured_image, status, featured } = body;

    if (!title) {
      return sendJSON(res, 400, { error: 'Title is required' });
    }
    let slug = body.slug;
    if (!slug) {
      slug = await Post.generateUniqueSlug(title);
    } else {
      if (await Post.slugExists(slug)) {
        slug = await Post.generateUniqueSlug(slug);
      }
    }

    const postId = await Post.create({
      title,
      slug,
      content: content || '',
      excerpt: excerpt || '',
      category: category || null,
      author_id: decoded.userId,
      featured_image: featured_image || null,
      status: status || 'draft',
      featured: featured || false
    });

    const post = await Post.findById(postId);
    sendJSON(res, 201, { post, message: 'Post created successfully' });
  } catch (error) {
    console.error('Error creating post:', error);
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('slug')) {
      return sendJSON(res, 400, { error: 'A post with this slug already exists. Please use a different title or slug.' });
    }
    
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function updatePost(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return sendJSON(res, 401, { error: 'Authentication required' });
    }

    const { verifyToken } = require('../src/config/auth');
    const decoded = verifyToken(token);
    if (!decoded) {
      return sendJSON(res, 403, { error: 'Invalid or expired token' });
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const id = parseInt(pathParts[pathParts.length - 1]);

    if (!id || isNaN(id)) {
      return sendJSON(res, 400, { error: 'Invalid post ID' });
    }

    const body = await parseBody(req);
    if (body.title && !body.slug) {
      body.slug = await Post.generateUniqueSlug(body.title, id);
    } else if (body.slug) {
      if (await Post.slugExists(body.slug, id)) {
        body.slug = await Post.generateUniqueSlug(body.slug, id);
      }
    }

    const updated = await Post.update(id, body);
    if (!updated) {
      return sendJSON(res, 404, { error: 'Post not found' });
    }

    const post = await Post.findById(id);
    sendJSON(res, 200, { post, message: 'Post updated successfully' });
  } catch (error) {
    console.error('Error updating post:', error);
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('slug')) {
      return sendJSON(res, 400, { error: 'A post with this slug already exists. Please use a different title or slug.' });
    }
    
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function deletePost(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return sendJSON(res, 401, { error: 'Authentication required' });
    }

    const { verifyToken } = require('../src/config/auth');
    const decoded = verifyToken(token);
    if (!decoded) {
      return sendJSON(res, 403, { error: 'Invalid or expired token' });
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const id = parseInt(pathParts[pathParts.length - 1]);

    if (!id || isNaN(id)) {
      return sendJSON(res, 400, { error: 'Invalid post ID' });
    }

    const deleted = await Post.delete(id);
    if (!deleted) {
      return sendJSON(res, 404, { error: 'Post not found' });
    }

    sendJSON(res, 200, { message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

module.exports = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost
};

