const prisma = require('../src/config/database');

class Category {
  static async findAll(type = null) {
    return prisma.category.findMany({
      where: type ? { type } : {},
      include: type === 'STUDY' ? { domain: true, modules: { orderBy: { display_order: 'asc' } } } : undefined,
      orderBy: type === 'STUDY' ? [{ display_order: 'asc' }, { name: 'asc' }] : { name: 'asc' }
    });
  }

  static async findById(id) {
    return prisma.category.findUnique({ where: { id: Number(id) } });
  }

  static async findByName(name) {
    return prisma.category.findUnique({ where: { name } });
  }

  static async create(categoryData) {
    const { name, slug, description, distribution, clientNeed, type, domainId, displayOrder, isPublished } = categoryData;
    const category = await prisma.category.create({
      data: {
        name,
        slug: slug || this.generateSlug(name),
        description: description || null,
        distribution: distribution ?? null,
        client_need: clientNeed || null,
        type: type || 'BLOG',
        domain_id: domainId ? Number(domainId) : null,
        display_order: Number(displayOrder) || 0,
        is_published: isPublished !== false
      },
      select: { id: true }
    });
    return category.id;
  }

  static async update(id, categoryData) {
    const fieldMap = {
      name: 'name', slug: 'slug', description: 'description',
      distribution: 'distribution', clientNeed: 'client_need', type: 'type',
      domainId: 'domain_id', displayOrder: 'display_order', isPublished: 'is_published'
    };
    const data = Object.fromEntries(
      Object.entries(fieldMap)
        .filter(([field]) => categoryData[field] !== undefined)
        .map(([field, databaseField]) => [databaseField, categoryData[field] === '' ? null : categoryData[field] ?? null])
    );

    if (Object.keys(data).length === 0) {
      return false;
    }
    if (data.domain_id !== undefined) data.domain_id = data.domain_id ? Number(data.domain_id) : null;
    if (data.display_order !== undefined) data.display_order = Number(data.display_order) || 0;

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
