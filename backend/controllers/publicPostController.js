const Post = require('../models/Post');
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}
async function getPublishedPosts(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || null;
    const featured = url.searchParams.get('featured') === 'true' ? true : null;
    if (isNaN(page) || page < 1) {
      return sendJSON(res, 400, { error: 'Invalid page number' });
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return sendJSON(res, 400, { error: 'Invalid limit (must be between 1 and 100)' });
    }
    const result = await Post.findAll({ 
      page, 
      limit, 
      search, 
      status: 'published',
      category,
      featured
    });
    
    sendJSON(res, 200, result);
  } catch (error) {
    console.error('Error fetching published posts:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function getPostBySlug(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const slug = pathParts[pathParts.length - 1];

    if (!slug) {
      return sendJSON(res, 400, { error: 'Slug is required' });
    }

    const post = await Post.findBySlug(slug);
    
    if (!post) {
      return sendJSON(res, 404, { error: 'Post not found' });
    }
    if (post.status !== 'published') {
      return sendJSON(res, 404, { error: 'Post not found' });
    }

    sendJSON(res, 200, { post });
  } catch (error) {
    console.error('Error fetching post:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function getPostById(req, res) {
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
    if (post.status !== 'published') {
      return sendJSON(res, 404, { error: 'Post not found' });
    }

    sendJSON(res, 200, { post });
  } catch (error) {
    console.error('Error fetching post:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

module.exports = {
  getPublishedPosts,
  getPostBySlug,
  getPostById
};

