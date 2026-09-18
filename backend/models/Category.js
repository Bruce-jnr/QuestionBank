const prisma = require('../src/config/database');

class Category {
  static async findAll() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  static async findById(id) {
    return prisma.category.findUnique({ where: { id: Number(id) } });
  }

  static async findByName(name) {
    return prisma.category.findUnique({ where: { name } });
  }

  static async create(categoryData) {
    const { name, slug, description } = categoryData;
    const category = await prisma.category.create({
      data: {
        name,
        slug: slug || this.generateSlug(name),
        description: description || null
      },
      select: { id: true }
    });
    return category.id;
  }

  static async update(id, categoryData) {
    const allowedFields = ['name', 'slug', 'description'];
    const data = Object.fromEntries(
      allowedFields
        .filter((field) => categoryData[field] !== undefined)
        .map((field) => [field, categoryData[field]])
    );

    if (Object.keys(data).length === 0) {
      return false;
    }

    const result = await prisma.category.updateMany({
      where: { id: Number(id) },
      data
    });
    return result.count > 0;
  }

  static async delete(id) {
    const category = await this.findById(id);
    if (!category) {
      return false;
    }

    const postCount = await prisma.post.count({
      where: { category: category.name }
    });
    if (postCount > 0) {
      throw new Error('Cannot delete category that is in use by posts');
    }

    const result = await prisma.category.deleteMany({ where: { id: Number(id) } });
    return result.count > 0;
  }

  static generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = Category;
