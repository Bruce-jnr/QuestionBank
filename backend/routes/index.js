const { handlePostRoutes } = require('./posts');
const { handlePublicPostRoutes } = require('./publicPosts');
const { handleCategoryRoutes } = require('./categories');
const {
  handlePublicCommentRoutes,
  handleAdminCommentRoutes,
} = require('./comments');
const { handleSettingsRoutes } = require('./settings');
const { getCategories } = require('../controllers/categoryController');

function handleApiRoutes(req, res, pathname) {
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
