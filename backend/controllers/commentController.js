const Comment = require('../models/Comment');
const Post = require('../models/Post');

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}
async function getPostComments(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const postId = parseInt(pathParts[pathParts.length - 1]);

    if (!postId || isNaN(postId)) {
      return sendJSON(res, 400, { error: 'Invalid post ID' });
    }
    const post = await Post.findById(postId);
    if (!post || post.status !== 'published') {
      return sendJSON(res, 404, { error: 'Post not found' });
    }

    const comments = await Comment.findByPostId(postId, { 
      includeReplies: true, 
      status: 'approved' 
    });
    const commentMap = new Map();
    const rootComments = [];
    comments.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment.id, comment);
    });
    comments.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    sendJSON(res, 200, { comments: rootComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function createComment(req, res) {
  try {
    let body = '';
    let bodyBytes = 0;
    let requestTooLarge = false;
    req.on('data', chunk => {
      bodyBytes += chunk.length;
      if (bodyBytes > 16 * 1024) {
        requestTooLarge = true;
        return;
      }
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        if (requestTooLarge) return sendJSON(res, 413, { error: 'Comment request is too large' });
        const data = JSON.parse(body);
        const { post_id, parent_id, author_name, author_email, content } = data;
        if (!post_id || typeof author_name !== 'string' || typeof content !== 'string' || !author_name.trim() || !content.trim()) {
          return sendJSON(res, 400, { 
            error: 'Missing required fields: post_id, author_name, content' 
          });
        }

        if (content.trim().length < 3) {
          return sendJSON(res, 400, { 
            error: 'Comment must be at least 3 characters long' 
          });
        }
        if (content.trim().length > 5000 || author_name.trim().length > 100) {
          return sendJSON(res, 400, { error: 'Comment name or content is too long' });
        }
        if (author_email && (author_email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author_email))) {
          return sendJSON(res, 400, { error: 'Enter a valid email address' });
        }
        const post = await Post.findById(post_id);
        if (!post || post.status !== 'published') {
          return sendJSON(res, 404, { error: 'Post not found' });
        }
        if (parent_id) {
          const parentComment = await Comment.findById(parent_id);
          if (!parentComment || parentComment.post_id !== post_id) {
            return sendJSON(res, 400, { error: 'Invalid parent comment' });
          }
        }

        const comment = await Comment.create({
          post_id,
          parent_id: parent_id || null,
          author_name: author_name.trim(),
          author_email: author_email ? author_email.trim() : null,
          content: content.trim()
        });

        sendJSON(res, 201, { comment });
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        sendJSON(res, 400, { error: 'Invalid JSON in request body' });
      }
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function upvoteComment(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const commentId = parseInt(pathParts[pathParts.length - 1]);

    if (!commentId || isNaN(commentId)) {
      return sendJSON(res, 400, { error: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment || comment.status !== 'approved') {
      return sendJSON(res, 404, { error: 'Comment not found' });
    }

    const updatedComment = await Comment.upvote(commentId);
    sendJSON(res, 200, { comment: updatedComment });
  } catch (error) {
    console.error('Error upvoting comment:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function getAllComments(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const status = url.searchParams.get('status') || null;
    const postId = url.searchParams.get('post_id') ? parseInt(url.searchParams.get('post_id')) : null;

    const result = await Comment.findAll({ page, limit, status, postId });
    sendJSON(res, 200, result);
  } catch (error) {
    console.error('Error fetching comments:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function updateCommentStatus(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const commentId = parseInt(pathParts[pathParts.length - 1]);

    if (!commentId || isNaN(commentId)) {
      return sendJSON(res, 400, { error: 'Invalid comment ID' });
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { status } = data;

        if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
          return sendJSON(res, 400, { 
            error: 'Invalid status. Must be: pending, approved, or rejected' 
          });
        }

        const comment = await Comment.update(commentId, { status });
        sendJSON(res, 200, { comment });
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        sendJSON(res, 400, { error: 'Invalid JSON in request body' });
      }
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function deleteComment(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const commentId = parseInt(pathParts[pathParts.length - 1]);

    if (!commentId || isNaN(commentId)) {
      return sendJSON(res, 400, { error: 'Invalid comment ID' });
    }

    await Comment.delete(commentId);
    sendJSON(res, 200, { message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

module.exports = {
  getPostComments,
  createComment,
  upvoteComment,
  getAllComments,
  updateCommentStatus,
  deleteComment
};

