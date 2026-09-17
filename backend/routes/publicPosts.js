const {
  getPublishedPosts,
  getPostBySlug,
  getPostById
} = require('../controllers/publicPostController');
function handlePublicPostRoutes(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const slugMatch = pathname.match(/^\/api\/public\/posts\/slug\/(.+)$/);
  if (slugMatch && req.method === 'GET') {
    req.url = `/api/public/posts/slug/${slugMatch[1]}`;
    getPostBySlug(req, res);
    return true;
  }
  const idMatch = pathname.match(/^\/api\/public\/posts\/(\d+)$/);
  if (idMatch && !pathname.startsWith('/api/public/posts/slug/') && req.method === 'GET') {
    getPostById(req, res);
    return true;
  }
  if (pathname === '/api/public/posts' && req.method === 'GET') {
    getPublishedPosts(req, res);
    return true;
  }

  return false;
}

module.exports = {
  handlePublicPostRoutes
};

