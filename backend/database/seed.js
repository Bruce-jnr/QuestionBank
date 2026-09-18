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
  ['contact_email', 'admin@nclexprep.com', 'string', 'Contact email address'],
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

const questions = [
  {
    external_id: 'demo-management-001',
    stem: 'A nurse receives change-of-shift report on four clients.',
    prompt: 'Which client should the nurse assess first?',
    options: [
      { id: 'a', text: 'A client requesting pain medication after surgery' },
      { id: 'b', text: 'A client with new inspiratory stridor after thyroid surgery' },
      { id: 'c', text: 'A client waiting for discharge teaching' },
      { id: 'd', text: 'A client with a scheduled dressing change' },
    ],
    correct_answers: ['b'],
    rationale: 'New inspiratory stridor can indicate airway obstruction and requires immediate assessment.',
    client_need: 'MANAGEMENT_OF_CARE',
  },
  {
    external_id: 'demo-pharmacology-001',
    stem: 'A client has a prescription for intravenous potassium chloride.',
    prompt: 'Which action should the nurse take?',
    options: [
      { id: 'a', text: 'Administer the medication by IV push' },
      { id: 'b', text: 'Add the medication to a hanging IV bag' },
      { id: 'c', text: 'Dilute it and administer it with a controlled infusion pump' },
      { id: 'd', text: 'Give the medication as a rapid bolus' },
    ],
    correct_answers: ['c'],
    rationale: 'IV potassium must be diluted and delivered with a controlled infusion pump. It is never given by IV push.',
    client_need: 'PHARMACOLOGICAL_AND_PARENTERAL_THERAPIES',
  },
  {
    external_id: 'demo-adaptation-001',
    stem: 'A client has a serum potassium level of 6.4 mEq/L.',
    prompt: 'Which electrocardiogram finding should the nurse expect?',
    options: [
      { id: 'a', text: 'Prominent U waves' },
      { id: 'b', text: 'ST-segment elevation' },
      { id: 'c', text: 'Tall, peaked T waves' },
      { id: 'd', text: 'A shortened PR interval' },
    ],
    correct_answers: ['c'],
    rationale: 'Hyperkalemia commonly produces tall, peaked T waves and can progress to dangerous conduction abnormalities.',
    client_need: 'PHYSIOLOGICAL_ADAPTATION',
  },
  {
    external_id: 'demo-risk-001',
    stem: 'A client returns from a cardiac catheterization performed through the femoral artery.',
    prompt: 'Which finding requires immediate action?',
    options: [
      { id: 'a', text: 'A small bruise at the insertion site' },
      { id: 'b', text: 'Mild tenderness at the insertion site' },
      { id: 'c', text: 'A cool leg with a weak pedal pulse' },
      { id: 'd', text: 'A heart rate of 82 beats per minute' },
    ],
    correct_answers: ['c'],
    rationale: 'A cool extremity and weak distal pulse can indicate impaired arterial perfusion and require immediate intervention.',
    client_need: 'REDUCTION_OF_RISK_POTENTIAL',
  },
  {
    external_id: 'demo-safety-001',
    stem: 'A nurse is caring for a client with Clostridioides difficile infection.',
    prompt: 'Which hand hygiene method should the nurse use after providing care?',
    options: [
      { id: 'a', text: 'Wash with soap and water' },
      { id: 'b', text: 'Use alcohol-based hand rub only' },
      { id: 'c', text: 'Wear sterile gloves until leaving the unit' },
      { id: 'd', text: 'Rinse hands with water only' },
    ],
    correct_answers: ['a'],
    rationale: 'Soap and water physically remove C. difficile spores more effectively than alcohol-based hand rub.',
    client_need: 'SAFETY_AND_INFECTION_CONTROL',
  },
  {
    external_id: 'demo-health-001',
    stem: 'A nurse is reviewing immunizations with a healthy adult client.',
    prompt: 'Which statement demonstrates an understanding of preventive care?',
    options: [
      { id: 'a', text: 'Vaccines are only needed during childhood' },
      { id: 'b', text: 'Antibiotics can replace routine vaccination' },
      { id: 'c', text: 'Recommended vaccines should continue throughout adulthood' },
      { id: 'd', text: 'Vaccination is unnecessary without current symptoms' },
    ],
    correct_answers: ['c'],
    rationale: 'Adults should receive recommended vaccines based on age, health conditions, prior vaccination, and risk factors.',
    client_need: 'HEALTH_PROMOTION_AND_MAINTENANCE',
  },
  {
    external_id: 'demo-psychosocial-001',
    stem: 'A client says, “I feel overwhelmed since receiving my diagnosis.”',
    prompt: 'Which response by the nurse is therapeutic?',
    options: [
      { id: 'a', text: 'You should try not to worry about it' },
      { id: 'b', text: 'Tell me more about what feels overwhelming' },
      { id: 'c', text: 'Everything will be fine' },
      { id: 'd', text: 'Other clients have handled this well' },
    ],
    correct_answers: ['b'],
    rationale: 'An open-ended invitation encourages the client to express concerns without minimizing or giving false reassurance.',
    client_need: 'PSYCHOSOCIAL_INTEGRITY',
  },
  {
    external_id: 'demo-comfort-001',
    stem: 'A bedbound client is at risk for a pressure injury.',
    prompt: 'Which intervention should the nurse include in the plan of care?',
    options: [
      { id: 'a', text: 'Massage reddened bony prominences' },
      { id: 'b', text: 'Keep the head of the bed at 60 degrees' },
      { id: 'c', text: 'Reposition regularly and offload the heels' },
      { id: 'd', text: 'Use a donut-shaped cushion under the sacrum' },
    ],
    correct_answers: ['c'],
    rationale: 'Regular repositioning and heel offloading reduce sustained pressure and help prevent pressure injuries.',
    client_need: 'BASIC_CARE_AND_COMFORT',
  },
];

async function seedDatabase() {
  try {
    const defaultPassword = 'admin123';
    const hashedPassword = await hashPassword(defaultPassword);

    const admin = await prisma.admin.upsert({
      where: { username: 'admin' },
      create: {
        username: 'admin',
        password: hashedPassword,
        email: 'admin@nclexprep.com',
      },
      update: {},
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

    for (const question of questions) {
      await prisma.question.upsert({
        where: { external_id: question.external_id },
        create: {
          ...question,
          prompt: question.prompt,
          question_type: 'MULTIPLE_CHOICE',
          scoring_method: 'ZERO_ONE',
          difficulty: 0.5,
          status: 'PUBLISHED',
          created_by: admin.id,
        },
        update: {
          ...question,
          prompt: question.prompt,
          question_type: 'MULTIPLE_CHOICE',
          scoring_method: 'ZERO_ONE',
          difficulty: 0.5,
          status: 'PUBLISHED',
        },
      });
    }

    console.log('PostgreSQL database seeded successfully.');
    console.log('Default admin username: admin');
    console.log('Default admin password: admin123');
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
