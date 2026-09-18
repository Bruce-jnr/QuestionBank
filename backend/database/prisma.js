const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  override: true,
});

const prismaCli = require.resolve('prisma/build/index.js');
const schema = path.resolve(__dirname, '../prisma/schema.prisma');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('A Prisma command is required.');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [prismaCli, ...args, '--schema', schema],
  { cwd: path.resolve(__dirname, '..'), env: process.env, stdio: 'inherit' },
);

process.exit(result.status ?? 1);
