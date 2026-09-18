const prisma = require('../src/config/database');

function normalizePost(post) {
  if (!post) {
    return null;
  }

  const { author, ...data } = post;
  return { ...data, author_name: author?.username || null };
}

class Post {
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = null,
      category = null,
      featured = null
    } = options;
    const limitInt = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const pageInt = Math.max(1, parseInt(page, 10) || 1);
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { username: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = category;
    }
    if (featured !== null) {
      where.featured = Boolean(featured);
    }

    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        include: { author: { select: { username: true } } },
        orderBy: { created_at: 'desc' },
        skip: (pageInt - 1) * limitInt,
        take: limitInt
      }),
      prisma.post.count({ where })
    ]);

    return {
      posts: posts.map(normalizePost),
      pagination: {
        page: pageInt,
        limit: limitInt,
        total,
        totalPages: Math.ceil(total / limitInt)
      }
    };
  }

  static async findById(id) {
    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
      include: { author: { select: { username: true } } }
    });
    return normalizePost(post);
  }

  static async findBySlug(slug) {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: { author: { select: { username: true } } }
    });
    return normalizePost(post);
  }

  static async create(postData) {
    const {
      title,
      slug,
      content,
      excerpt,
      category,
      author_id,
      featured_image,
      status = 'draft',
      featured = false
    } = postData;

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        category,
        author_id: author_id ? Number(author_id) : null,
        featured_image,
        status,
        featured: Boolean(featured),
        published_at: status === 'published' ? new Date() : null
      },
      select: { id: true }
    });
    return post.id;
  }

  static async update(id, postData) {
    const allowedFields = [
      'title',
      'slug',
      'content',
      'excerpt',
      'category',
      'featured_image',
      'status',
      'featured'
    ];
    const data = Object.fromEntries(
      allowedFields
        .filter((field) => postData[field] !== undefined)
        .map((field) => [field, postData[field]])
    );

    if (Object.keys(data).length === 0) {
      return false;
    }

    if (data.featured !== undefined) {
      data.featured = Boolean(data.featured);
    }
    if (data.status === 'published') {
      const existing = await prisma.post.findUnique({
        where: { id: Number(id) },
        select: { published_at: true }
      });
      if (!existing) {
        return false;
      }
      data.published_at = existing.published_at || new Date();
    }

    const result = await prisma.post.updateMany({
      where: { id: Number(id) },
      data
    });
    return result.count > 0;
  }

  static async delete(id) {
    const result = await prisma.post.deleteMany({ where: { id: Number(id) } });
    return result.count > 0;
  }

  static async slugExists(slug, excludeId = null) {
    const where = { slug };
    if (excludeId) {
      where.id = { not: Number(excludeId) };
    }
    return (await prisma.post.count({ where })) > 0;
  }

  static async generateUniqueSlug(title, excludeId = null) {
    const baseSlug = this.generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    while (await this.slugExists(slug, excludeId)) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }
    return slug;
  }

  static generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = Post;
