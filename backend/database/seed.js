const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  override: true,
});

const prisma = require('../src/config/database');
const { hashPassword } = require('../src/config/auth');

const categories = [
  {
    name: 'Management of Care',
    slug: 'management-of-care',
    description: 'Prioritization, delegation, advocacy, collaboration, and continuity of care.',
    distribution: 20,
    client_need: 'MANAGEMENT_OF_CARE',
    type: 'STUDY',
  },
  {
    name: 'Pharmacological and Parenteral Therapies',
    slug: 'pharmacological-and-parenteral-therapies',
    description: 'Medication administration, expected effects, adverse effects, and parenteral therapy.',
    distribution: 15,
    client_need: 'PHARMACOLOGICAL_AND_PARENTERAL_THERAPIES',
    type: 'STUDY',
  },
  {
    name: 'Physiological Adaptation',
    slug: 'physiological-adaptation',
    description: 'Care for acute, chronic, life-threatening, and complex health conditions.',
    distribution: 14,
    client_need: 'PHYSIOLOGICAL_ADAPTATION',
    type: 'STUDY',
  },
  {
    name: 'Reduction of Risk Potential',
    slug: 'reduction-of-risk-potential',
    description: 'Recognizing complications and reducing risks related to treatments and procedures.',
    distribution: 12,
    client_need: 'REDUCTION_OF_RISK_POTENTIAL',
    type: 'STUDY',
  },
  {
    name: 'Safety and Infection Control',
    slug: 'safety-and-infection-control',
    description: 'Protecting clients and healthcare personnel from health and environmental hazards.',
    distribution: 12,
    client_need: 'SAFETY_AND_INFECTION_CONTROL',
    type: 'STUDY',
  },
  {
    name: 'Health Promotion and Maintenance',
    slug: 'health-promotion-and-maintenance',
    description: 'Growth, development, prevention, screening, and healthy lifestyle choices.',
    distribution: 9,
    client_need: 'HEALTH_PROMOTION_AND_MAINTENANCE',
    type: 'STUDY',
  },
  {
    name: 'Psychosocial Integrity',
    slug: 'psychosocial-integrity',
    description: 'Mental health, coping, therapeutic communication, and emotional support.',
    distribution: 9,
    client_need: 'PSYCHOSOCIAL_INTEGRITY',
    type: 'STUDY',
  },
  {
    name: 'Basic Care and Comfort',
    slug: 'basic-care-and-comfort',
    description: 'Mobility, nutrition, elimination, personal care, rest, and non-pharmacological comfort.',
    distribution: 9,
    client_need: 'BASIC_CARE_AND_COMFORT',
    type: 'STUDY',
  },
  {
    name: 'Pharmacology',
    slug: 'pharmacology',
    description: 'Medication and drug-related topics',
  },
  {
    name: 'Pediatrics',
    slug: 'pediatrics',
    description: 'Child health and pediatric nursing',
  },
  {
    name: 'Fundamentals',
    slug: 'fundamentals',
    description: 'Basic nursing concepts',
  },
  {
    name: 'Med-Surg',
    slug: 'med-surg',
    description: 'Medical-surgical nursing',
  },
  {
    name: 'Mental Health',
    slug: 'mental-health',
    description: 'Psychiatric and mental health nursing',
  },
  {
    name: 'Test Anxiety',
    slug: 'test-anxiety',
    description: 'Strategies for managing exam stress',
  },
  {
    name: 'Patient Care',
    slug: 'patient-care',
    description: 'Patient care prioritization and delegation',
  },
  {
    name: 'Study Strategies',
    slug: 'study-strategies',
    description: 'Effective study techniques',
  },
  {
    name: 'Test Taking',
    slug: 'test-taking',
    description: 'Test-taking strategies and tips',
  },
  {
    name: 'Wellness',
    slug: 'wellness',
    description: 'Health and wellness for nurses',
  },
];

const settings = [
  [
    'site_name',
    'CBRUCENCLEX',
    'string',
    'Site name displayed in header and title',
  ],
  [
    'site_description',
    'Your trusted resource for NCLEX exam preparation',
    'string',
    'Site description for SEO',
  ],
  [
    'contact_email',
    process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL || 'support@cbrucenclex.com',
    'string',
    'Contact email address',
  ],
  ['posts_per_page', '10', 'number', 'Number of posts to display per page'],
  [
    'comments_enabled',
    'true',
    'boolean',
    'Enable or disable comments on posts',
  ],
  [
    'comments_auto_approve',
    'false',
    'boolean',
    'Automatically approve comments without moderation',
  ],
  ['default_post_status', 'draft', 'string', 'Default status for new posts'],
];

const studyDomains = [
  { name: 'Safe and Effective Care Environment', description: 'Management, coordination, safety, and infection prevention across care settings.', display_order: 1, needs: ['MANAGEMENT_OF_CARE', 'SAFETY_AND_INFECTION_CONTROL'] },
  { name: 'Health Promotion and Maintenance', description: 'Growth, prevention, screening, education, and healthy development across the lifespan.', display_order: 2, needs: ['HEALTH_PROMOTION_AND_MAINTENANCE'] },
  { name: 'Psychosocial Integrity', description: 'Mental health, coping, communication, crisis care, and emotional support.', display_order: 3, needs: ['PSYCHOSOCIAL_INTEGRITY'] },
  { name: 'Physiological Integrity', description: 'Foundational care, medication therapy, risk reduction, and adaptation to illness.', display_order: 4, needs: ['BASIC_CARE_AND_COMFORT', 'PHARMACOLOGICAL_AND_PARENTERAL_THERAPIES', 'REDUCTION_OF_RISK_POTENTIAL', 'PHYSIOLOGICAL_ADAPTATION'] },
];


async function seedDatabase() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL;
    if (!adminUsername || !adminPassword || adminPassword.length < 16) {
      throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD (minimum 16 characters) are required in .env');
    }
    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL or CONTACT_EMAIL is required in .env');
    }
    const hashedPassword = await hashPassword(adminPassword);

    const admin = await prisma.admin.upsert({
      where: { username: adminUsername },
      create: {
        username: adminUsername,
        password: hashedPassword,
        email: adminEmail,
      },
      update: { password: hashedPassword, email: adminEmail },
    });

    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        create: category,
        update: {
          slug: category.slug,
          description: category.description,
          distribution: category.distribution ?? null,
          client_need: category.client_need ?? null,
          type: category.type ?? 'BLOG',
        },
      });
    }

    for (const domain of studyDomains) {
      const savedDomain = await prisma.studyDomain.upsert({
        where: { name: domain.name },
        create: { name: domain.name, description: domain.description, display_order: domain.display_order },
        update: { description: domain.description, display_order: domain.display_order },
      });
      await prisma.category.updateMany({
        where: { client_need: { in: domain.needs } },
        data: { domain_id: savedDomain.id },
      });
    }

    for (const [key, value, type, description] of settings) {
      await prisma.setting.upsert({
        where: { setting_key: key },
        create: {
          setting_key: key,
          setting_value: value,
          setting_type: type,
          description,
        },
        update: {
          setting_value: value,
          setting_type: type,
          description,
        },
      });
    }

    console.log('PostgreSQL database seeded successfully.');
    console.log(`Administrator account ready: ${adminUsername}`);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
