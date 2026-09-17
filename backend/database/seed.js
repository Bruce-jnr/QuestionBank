const pool = require('../src/config/database');
const { hashPassword } = require('../src/config/auth');

async function seedDatabase() {
  try {
    console.log('Seeding database...');
    try {
      await pool.execute('SELECT 1');
    } catch (err) {
      if (err.code === 'ER_BAD_DB_ERROR') {
        console.error('Database does not exist.');
        console.error(`   Database name: ${process.env.DB_NAME || 'nclex_prep'}`);
        console.error('\nRun "npm run setup" first to create the database.');
        process.exit(1);
      }
      throw err;
    }
    const defaultPassword = 'admin123';
    const hashedPassword = await hashPassword(defaultPassword);

    const [result] = await pool.execute(
      'INSERT INTO admins (username, password, email) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password = ?',
      ['admin', hashedPassword, 'admin@nclexprep.com', hashedPassword]
    );

    console.log('Default admin user created or updated');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   (Please change this password after first login!)');
    const categories = [
      { name: 'Pharmacology', slug: 'pharmacology', description: 'Medication and drug-related topics' },
      { name: 'Pediatrics', slug: 'pediatrics', description: 'Child health and pediatric nursing' },
      { name: 'Fundamentals', slug: 'fundamentals', description: 'Basic nursing concepts' },
      { name: 'Med-Surg', slug: 'med-surg', description: 'Medical-surgical nursing' },
      { name: 'Mental Health', slug: 'mental-health', description: 'Psychiatric and mental health nursing' },
      { name: 'Test Anxiety', slug: 'test-anxiety', description: 'Strategies for managing exam stress' },
      { name: 'Patient Care', slug: 'patient-care', description: 'Patient care prioritization and delegation' },
      { name: 'Study Strategies', slug: 'study-strategies', description: 'Effective study techniques' },
      { name: 'Test Taking', slug: 'test-taking', description: 'Test-taking strategies and tips' },
      { name: 'Wellness', slug: 'wellness', description: 'Health and wellness for nurses' }
    ];

    for (const category of categories) {
      await pool.execute(
        'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = name',
        [category.name, category.slug, category.description]
      );
    }

    console.log('Categories seeded');

    console.log('Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

