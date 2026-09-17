const {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
function handleCategoryRoutes(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const idMatch = pathname.match(/^\/api\/categories\/(\d+)$/);
  if (idMatch) {
    if (req.method === 'GET') {
      getCategory(req, res);
      return true;
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      updateCategory(req, res);
      return true;
    } else if (req.method === 'DELETE') {
      deleteCategory(req, res);
      return true;
    }
    return false;
  }
  if (pathname === '/api/categories') {
    if (req.method === 'GET') {
      getAllCategories(req, res);
      return true;
    } else if (req.method === 'POST') {
      createCategory(req, res);
      return true;
    }
  }

  return false;
}

module.exports = {
  handleCategoryRoutes
};

