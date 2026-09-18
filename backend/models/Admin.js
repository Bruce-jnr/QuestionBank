const prisma = require('../src/config/database');

class Admin {
  static async findByUsername(username) {
    return prisma.admin.findUnique({
      where: { username },
      select: { id: true, username: true, password: true, email: true }
    });
  }

  static async findById(id) {
    return prisma.admin.findUnique({
      where: { id: Number(id) },
      select: { id: true, username: true, email: true }
    });
  }

  static async create(username, password, email = null) {
    const admin = await prisma.admin.create({
      data: { username, password, email },
      select: { id: true }
    });
    return admin.id;
  }

  static async updatePassword(id, hashedPassword) {
    await prisma.admin.update({
      where: { id: Number(id) },
      data: { password: hashedPassword }
    });
  }

  static async updateEmail(id, email) {
    await prisma.admin.update({
      where: { id: Number(id) },
      data: { email }
    });
  }
}

module.exports = Admin;
