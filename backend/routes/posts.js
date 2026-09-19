const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost
} = require('../controllers/postController');
const { authenticateToken } = require('../middleware/auth');
const postRoutes = {
  '/api/posts': {
    GET: getPosts,
    POST: createPost
  }
};
function handlePostRoutes(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const postIdMatch = pathname.match(/^\/api\/posts\/(\d+)$/);
  if (postIdMatch) {
    if (!['GET', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return false;
    authenticateToken(req, res, () => {
      if (req.method === 'GET') getPost(req, res);
      else if (req.method === 'PUT' || req.method === 'PATCH') updatePost(req, res);
      else deletePost(req, res);
    });
    return true;
  }
  if (pathname === '/api/posts') {
    const route = postRoutes[pathname];
    if (route && route[req.method]) {
      authenticateToken(req, res, () => route[req.method](req, res));
      return true;
    }
  }

  return false;
}

module.exports = {
  handlePostRoutes
};

