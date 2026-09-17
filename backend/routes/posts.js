const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost
} = require('../controllers/postController');
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
    if (req.method === 'GET') {
      getPost(req, res);
      return true;
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      updatePost(req, res);
      return true;
    } else if (req.method === 'DELETE') {
      deletePost(req, res);
      return true;
    }
    return false;
  }
  if (pathname === '/api/posts') {
    const route = postRoutes[pathname];
    if (route && route[req.method]) {
      route[req.method](req, res);
      return true;
    }
  }

  return false;
}

module.exports = {
  handlePostRoutes
};

