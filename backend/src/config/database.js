const path = require('path');
const { PrismaClient } = require('../../generated/prisma');

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to connect to PostgreSQL.');
}

const prisma = globalThis.__nclexPrisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__nclexPrisma = prisma;
}

module.exports = prisma;
