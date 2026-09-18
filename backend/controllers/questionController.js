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
  'MATRIX_GRID',
  'CLOZE_DROP_DOWN',
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
  })).min(2),
  correctAnswers: z.array(z.string().min(1)).min(1),
  rationale: z.string().trim().min(1),
  clientNeed: z.enum(clientNeeds),
  questionType: z.enum(questionTypes),
  scoringMethod: z.enum(['ZERO_ONE', 'PLUS_MINUS', 'RATIONALE']),
  difficulty: z.number().min(0).max(1).default(0.5),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
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
    ...(data.correctAnswers !== undefined ? { correct_answers: data.correctAnswers } : {}),
    ...(data.rationale !== undefined ? { rationale: data.rationale } : {}),
    ...(data.clientNeed !== undefined ? { client_need: data.clientNeed } : {}),
    ...(data.questionType !== undefined ? { question_type: data.questionType } : {}),
    ...(data.scoringMethod !== undefined ? { scoring_method: data.scoringMethod } : {}),
    ...(data.difficulty !== undefined ? { difficulty: data.difficulty } : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
    ...(createdBy !== undefined ? { created_by: createdBy } : {}),
  };
}

async function listQuestions(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const where = {
    ...(req.query.status ? { status: req.query.status } : {}),
    ...(req.query.clientNeed ? { client_need: req.query.clientNeed } : {}),
    ...(req.query.questionType ? { question_type: req.query.questionType } : {}),
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
    const questions = await prisma.$transaction(
      result.data.map((question) => prisma.question.create({
        data: questionData(question, req.user.userId),
      })),
    );
    return res.status(201).json({ imported: questions.length, questions });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'The import contains an existing question ID' });
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
