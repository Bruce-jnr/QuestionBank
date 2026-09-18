const prisma = require('../src/config/database');
const Category = require('../models/Category');
const { verifyToken } = require('../src/config/auth');
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify(data));
}
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
async function getCategories(req, res) {
  try {
    const groups = await prisma.post.groupBy({
      by: ['category'],
      where: {
        status: 'published',
        AND: [
          { category: { not: null } },
          { category: { not: '' } }
        ]
      },
      _count: { id: true },
      orderBy: { category: 'asc' }
    });
    const categories = groups.map((group) => ({
      name: group.category,
      post_count: group._count.id
    }));

    sendJSON(res, 200, { categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function getAllCategories(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return sendJSON(res, 401, { error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role && decoded.role !== 'admin')) {
      return sendJSON(res, 403, { error: 'Invalid or expired token' });
    }

    const categories = await Category.findAll();
    sendJSON(res, 200, { categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function getCategory(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return sendJSON(res, 401, { error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role && decoded.role !== 'admin')) {
      return sendJSON(res, 403, { error: 'Invalid or expired token' });
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const id = parseInt(pathParts[pathParts.length - 1]);

    if (!id || isNaN(id)) {
      return sendJSON(res, 400, { error: 'Invalid category ID' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return sendJSON(res, 404, { error: 'Category not found' });
    }

    sendJSON(res, 200, { category });
  } catch (error) {
    console.error('Error fetching category:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function createCategory(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return sendJSON(res, 401, { error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role && decoded.role !== 'admin')) {
      return sendJSON(res, 403, { error: 'Invalid or expired token' });
    }

    const body = await parseBody(req);
    const { name, slug, description } = body;

    if (!name) {
      return sendJSON(res, 400, { error: 'Category name is required' });
    }
    const existing = await Category.findByName(name);
    if (existing) {
      return sendJSON(res, 400, { error: 'Category with this name already exists' });
    }

    const categoryId = await Category.create({ name, slug, description });
    const category = await Category.findById(categoryId);

    sendJSON(res, 201, { category, message: 'Category created successfully' });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 'P2002') {
      return sendJSON(res, 400, { error: 'Category with this name or slug already exists' });
    }
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function updateCategory(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return sendJSON(res, 401, { error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role && decoded.role !== 'admin')) {
      return sendJSON(res, 403, { error: 'Invalid or expired token' });
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const id = parseInt(pathParts[pathParts.length - 1]);

    if (!id || isNaN(id)) {
      return sendJSON(res, 400, { error: 'Invalid category ID' });
    }

    const body = await parseBody(req);
    const updated = await Category.update(id, body);

    if (!updated) {
      return sendJSON(res, 404, { error: 'Category not found' });
    }

    const category = await Category.findById(id);
    sendJSON(res, 200, { category, message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 'P2002') {
      return sendJSON(res, 400, { error: 'Category with this name or slug already exists' });
    }
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function deleteCategory(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return sendJSON(res, 401, { error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return sendJSON(res, 403, { error: 'Invalid or expired token' });
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const id = parseInt(pathParts[pathParts.length - 1]);

    if (!id || isNaN(id)) {
      return sendJSON(res, 400, { error: 'Invalid category ID' });
    }

    const deleted = await Category.delete(id);
    if (!deleted) {
      return sendJSON(res, 404, { error: 'Category not found or cannot be deleted' });
    }

    sendJSON(res, 200, { message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error.message.includes('in use')) {
      return sendJSON(res, 400, { error: error.message });
    }
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

module.exports = {
  getCategories,
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};

