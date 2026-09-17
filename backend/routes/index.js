const authRoutes = require('./auth');
const { handlePostRoutes } = require('./posts');
const { handlePublicPostRoutes } = require('./publicPosts');
const { handleCategoryRoutes } = require('./categories');
const {
  handlePublicCommentRoutes,
  handleAdminCommentRoutes,
} = require('./comments');
const { handleSettingsRoutes } = require('./settings');
const { uploadFile } = require('../controllers/uploadController');
const { getCategories } = require('../controllers/categoryController');

function handleApiRoutes(req, res, pathname) {
  const authRoute = authRoutes[pathname];
  if (authRoute && authRoute[req.method]) {
    authRoute[req.method](req, res);
    return true;
  }

  if (pathname === '/api/upload' && req.method === 'POST') {
    uploadFile(req, res);
    return true;
  }

  if (pathname === '/api/public/categories' && req.method === 'GET') {
    getCategories(req, res);
    return true;
  }

  return (
    handleCategoryRoutes(req, res) ||
    handlePublicPostRoutes(req, res) ||
    handlePublicCommentRoutes(req, res) ||
    handlePostRoutes(req, res) ||
    handleAdminCommentRoutes(req, res) ||
    handleSettingsRoutes(req, res)
  );
}

module.exports = { handleApiRoutes };
