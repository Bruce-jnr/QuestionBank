const {
  getPostComments,
  createComment,
  upvoteComment,
  getAllComments,
  updateCommentStatus,
  deleteComment
} = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');
function handlePublicCommentRoutes(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const postCommentsMatch = pathname.match(/^\/api\/public\/comments\/post\/(\d+)$/);
  if (postCommentsMatch && req.method === 'GET') {
    getPostComments(req, res);
    return true;
  }
  if (pathname === '/api/public/comments' && req.method === 'POST') {
    createComment(req, res);
    return true;
  }
  const upvoteMatch = pathname.match(/^\/api\/public\/comments\/(\d+)\/upvote$/);
  if (upvoteMatch && req.method === 'POST') {
    upvoteComment(req, res);
    return true;
  }

  return false;
}
function handleAdminCommentRoutes(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const isAdminRoute = 
    (pathname === '/api/comments' && req.method === 'GET') ||
    pathname.match(/^\/api\/comments\/(\d+)\/status$/) ||
    (pathname.match(/^\/api\/comments\/(\d+)$/) && req.method === 'DELETE');

  if (!isAdminRoute) {
    return false;
  }
  authenticateToken(req, res, () => {
    if (pathname === '/api/comments' && req.method === 'GET') {
      getAllComments(req, res);
      return;
    }
    const statusMatch = pathname.match(/^\/api\/comments\/(\d+)\/status$/);
    if (statusMatch && req.method === 'PUT') {
      updateCommentStatus(req, res);
      return;
    }
    const deleteMatch = pathname.match(/^\/api\/comments\/(\d+)$/);
    if (deleteMatch && req.method === 'DELETE') {
      deleteComment(req, res);
      return;
    }
  });

  return true;
}

module.exports = {
  handlePublicCommentRoutes,
  handleAdminCommentRoutes
};

