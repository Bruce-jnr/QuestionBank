const { z } = require('zod');
const prisma = require('../src/config/database');

const clientNeeds = [
  'MANAGEMENT_OF_CARE',
  'SAFETY_AND_INFECTION_CONTROL',
  'HEALTH_PROMOTION_AND_MAINTENANCE',
  'PSYCHOSOCIAL_INTEGRITY',
  'BASIC_CARE_AND_COMFORT',
  'PHARMACOLOGICAL_AND_PARENTERAL_THERAPIES',
  'REDUCTION_OF_RISK_POTENTIAL',
  'PHYSIOLOGICAL_ADAPTATION',
];

const questionTypes = [
  'MULTIPLE_CHOICE',
  'MULTIPLE_RESPONSE',
  'EXTENDED_MULTIPLE_RESPONSE',
  'DRAG_DROP',
  'HOT_SPOT',
  'MATRIX_GRID',
  'CLOZE_DROP_DOWN',
  'CASE_STUDY',
  'RATIONALE_PAIRED',
  'BOW_TIE',
];

const questionSchema = z.object({
  externalId: z.string().trim().max(100).nullable().optional(),
  stem: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  options: z.array(z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    group: z.string().optional(),
  }).passthrough()).min(2),
  content: z.record(z.string(), z.unknown()).optional().default({}),
  correctAnswers: z.array(z.string().min(1)).min(1),
  rationale: z.string().trim().min(1),
  clientNeed: z.enum(clientNeeds),
  questionType: z.enum(questionTypes),
  scoringMethod: z.enum(['ZERO_ONE', 'PLUS_MINUS', 'RATIONALE']),
  difficulty: z.number().min(0).max(1).default(0.5),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  accessTier: z.enum(['FREE', 'PREMIUM']).default('FREE'),
});

const updateQuestionSchema = questionSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field is required',
);

function validationError(res, result) {
  return res.status(400).json({ error: result.error.issues[0]?.message || 'Invalid question' });
}

function questionData(data, createdBy) {
  return {
    ...(data.externalId !== undefined ? { external_id: data.externalId || null } : {}),
    ...(data.stem !== undefined ? { stem: data.stem } : {}),
    ...(data.prompt !== undefined ? { prompt: data.prompt } : {}),
    ...(data.options !== undefined ? { options: data.options } : {}),
    ...(data.content !== undefined ? { content: data.content } : {}),
    ...(data.correctAnswers !== undefined ? { correct_answers: data.correctAnswers } : {}),
    ...(data.rationale !== undefined ? { rationale: data.rationale } : {}),
    ...(data.clientNeed !== undefined ? { client_need: data.clientNeed } : {}),
    ...(data.questionType !== undefined ? { question_type: data.questionType } : {}),
    ...(data.scoringMethod !== undefined ? { scoring_method: data.scoringMethod } : {}),
    ...(data.difficulty !== undefined ? { difficulty: data.difficulty } : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
    ...(data.accessTier !== undefined ? { access_tier: data.accessTier } : {}),
    ...(createdBy !== undefined ? { created_by: createdBy } : {}),
  };
}

function normalizeQuestionText(value) {
  return String(value || '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function questionFingerprint(question) {
  return `${normalizeQuestionText(question.stem)}\u0000${normalizeQuestionText(question.prompt)}`;
}

async function listQuestions(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const status = ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(req.query.status) ? req.query.status : '';
  const clientNeed = clientNeeds.includes(req.query.clientNeed) ? req.query.clientNeed : '';
  const questionType = questionTypes.includes(req.query.questionType) ? req.query.questionType : '';
  const accessTier = ['FREE', 'PREMIUM'].includes(req.query.accessTier) ? req.query.accessTier : '';
  const where = {
    ...(status ? { status } : {}),
    ...(clientNeed ? { client_need: clientNeed } : {}),
    ...(questionType ? { question_type: questionType } : {}),
    ...(accessTier ? { access_tier: accessTier } : {}),
    ...(search ? {
      OR: [
        { external_id: { contains: search, mode: 'insensitive' } },
        { stem: { contains: search, mode: 'insensitive' } },
        { prompt: { contains: search, mode: 'insensitive' } },
      ],
    } : {}),
  };

  try {
    const [questions, total] = await prisma.$transaction([
      prisma.question.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.question.count({ where }),
    ]);
    return res.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('List questions error:', error);
    return res.status(500).json({ error: 'Unable to load questions' });
  }
}

async function createQuestion(req, res) {
  const result = questionSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result);

  try {
    const question = await prisma.question.create({
      data: questionData(result.data, req.user.userId),
    });
    return res.status(201).json({ question });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Question ID already exists' });
    console.error('Create question error:', error);
    return res.status(500).json({ error: 'Unable to create question' });
  }
}

async function updateQuestion(req, res) {
  const result = updateQuestionSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result);

  try {
    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: questionData(result.data),
    });
    return res.json({ question });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Question not found' });
    if (error.code === 'P2002') return res.status(409).json({ error: 'Question ID already exists' });
    console.error('Update question error:', error);
    return res.status(500).json({ error: 'Unable to update question' });
  }
}

async function archiveQuestion(req, res) {
  try {
    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED' },
    });
    return res.json({ question });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Question not found' });
    console.error('Archive question error:', error);
    return res.status(500).json({ error: 'Unable to archive question' });
  }
}

async function importQuestions(req, res) {
  const result = z.array(questionSchema).min(1).max(500).safeParse(req.body.questions);
  if (!result.success) return validationError(res, result);

  try {
    const existingQuestions = await prisma.question.findMany({
      select: { external_id: true, stem: true, prompt: true },
    });
    const knownIds = new Set(
      existingQuestions.map((question) => question.external_id).filter(Boolean),
    );
    const knownContent = new Set(existingQuestions.map(questionFingerprint));
    const accepted = [];
    const duplicates = [];

    result.data.forEach((question, index) => {
      const fingerprint = questionFingerprint(question);
      let reason = '';
      if (question.externalId && knownIds.has(question.externalId)) {
        reason = 'external ID already exists';
      } else if (knownContent.has(fingerprint)) {
        reason = 'matching stem and prompt already exist';
      }

      if (reason) {
        duplicates.push({
          row: index + 1,
          externalId: question.externalId || null,
          reason,
        });
        return;
      }

      accepted.push(question);
      if (question.externalId) knownIds.add(question.externalId);
      knownContent.add(fingerprint);
    });

    const questions = accepted.length ? await prisma.$transaction(
      accepted.map((question) => prisma.question.create({
        data: questionData(question, req.user.userId),
      })),
    ) : [];
    return res.status(201).json({
      imported: questions.length,
      skipped: duplicates.length,
      duplicates,
    });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'A duplicate was created by another import. Please upload the file again.' });
    console.error('Import questions error:', error);
    return res.status(500).json({ error: 'Unable to import questions' });
  }
}

module.exports = {
  archiveQuestion,
  createQuestion,
  importQuestions,
  listQuestions,
  updateQuestion,
};
