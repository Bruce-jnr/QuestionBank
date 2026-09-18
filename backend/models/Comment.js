const prisma = require('../src/config/database');

function normalizeComment(comment) {
  if (!comment) {
    return null;
  }

  const { post, ...data } = comment;
  if (!post) {
    return data;
  }
  return { ...data, post_title: post.title, post_slug: post.slug };
}

class Comment {
  static async findByPostId(postId, options = {}) {
    const { includeReplies = true, status = 'approved' } = options;
    const where = { post_id: Number(postId) };
    if (status) {
      where.status = status;
    }
    if (!includeReplies) {
      where.parent_id = null;
    }

    return prisma.comment.findMany({
      where,
      orderBy: { created_at: 'asc' }
    });
  }

  static async findById(id) {
    return prisma.comment.findUnique({ where: { id: Number(id) } });
  }

  static async findAll(options = {}) {
    const { page = 1, limit = 20, status = null, postId = null } = options;
    const limitInt = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const pageInt = Math.max(1, parseInt(page, 10) || 1);
    const where = {};
    if (status) {
      where.status = status;
    }
    if (postId) {
      where.post_id = Number(postId);
    }

    const [comments, total] = await prisma.$transaction([
      prisma.comment.findMany({
        where,
        include: { post: { select: { title: true, slug: true } } },
        orderBy: { created_at: 'desc' },
        skip: (pageInt - 1) * limitInt,
        take: limitInt
      }),
      prisma.comment.count({ where })
    ]);

    return {
      comments: comments.map(normalizeComment),
      pagination: {
        page: pageInt,
        limit: limitInt,
        total,
        totalPages: Math.ceil(total / limitInt)
      }
    };
  }

  static async create(commentData) {
    const { post_id, parent_id, author_name, author_email, content } = commentData;
    return prisma.comment.create({
      data: {
        post_id: Number(post_id),
        parent_id: parent_id ? Number(parent_id) : null,
        author_name,
        author_email: author_email || null,
        content,
        status: 'pending'
      }
    });
  }

  static async update(id, updateData) {
    const allowedFields = ['content', 'status', 'upvotes'];
    const data = Object.fromEntries(
      allowedFields
        .filter((field) => updateData[field] !== undefined)
        .map((field) => [field, updateData[field]])
    );

    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

    const result = await prisma.comment.updateMany({
      where: { id: Number(id) },
      data
    });
    return result.count > 0 ? this.findById(id) : null;
  }

  static async delete(id) {
    await prisma.comment.deleteMany({ where: { id: Number(id) } });
    return true;
  }

  static async upvote(id) {
    return prisma.comment.update({
      where: { id: Number(id) },
      data: { upvotes: { increment: 1 } }
    });
  }
}

module.exports = Comment;
