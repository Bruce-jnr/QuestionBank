const { z } = require('zod');
const prisma = require('../src/config/database');
const { calculateScore } = require('../utils/scoringEngine');
const { questionContentWithMedia } = require('../utils/questionMedia');

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

const startSchema = z.object({
  clientNeed: z.enum(clientNeeds).nullable().optional(),
  questionType: z.enum(questionTypes).nullable().optional(),
  questionCount: z.coerce.number().int().min(1).max(5).default(5),
});

const answerSchema = z.object({
  questionId: z.string().uuid(),
  selected: z.array(z.string()).min(1),
});

function shuffle(values) {
  const items = [...values];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [items[index], items[target]] = [items[target], items[index]];
  }
  return items;
}

function publicQuestion(question) {
  return {
    id: question.id,
    stem: question.stem,
    prompt: question.prompt,
    options: question.options,
    content: questionContentWithMedia(question.content),
    clientNeed: question.client_need,
    questionType: question.question_type,
  };
}

async function getAvailability(req, res) {
  try {
    const groups = await prisma.question.groupBy({
      by: ['client_need', 'question_type'],
      where: { status: 'PUBLISHED', access_tier: 'FREE' },
      _count: { id: true },
    });
    return res.json({
      total: groups.reduce((sum, group) => sum + group._count.id, 0),
      combinations: groups.map((group) => ({
        clientNeed: group.client_need,
        questionType: group.question_type,
        count: group._count.id,
      })),
    });
  } catch (error) {
    console.error('Guest question availability error:', error);
    return res.status(500).json({ error: 'Unable to load guest question availability' });
  }
}

async function startPreview(req, res) {
  const result = startSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0]?.message || 'Invalid selection' });

  try {
    const questions = await prisma.question.findMany({
      where: {
        status: 'PUBLISHED',
        access_tier: 'FREE',
        ...(result.data.clientNeed ? { client_need: result.data.clientNeed } : {}),
        ...(result.data.questionType ? { question_type: result.data.questionType } : {}),
      },
    });
    const selected = shuffle(questions).slice(0, result.data.questionCount);
    if (!selected.length) return res.status(409).json({ error: 'No free questions are available for this selection' });
    return res.json({ questions: selected.map(publicQuestion) });
  } catch (error) {
    console.error('Start guest preview error:', error);
    return res.status(500).json({ error: 'Unable to start guest practice' });
  }
}

async function submitAnswer(req, res) {
  const result = answerSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0]?.message || 'Invalid answer' });

  try {
    const question = await prisma.question.findFirst({
      where: {
        id: result.data.questionId,
        status: 'PUBLISHED',
        access_tier: 'FREE',
      },
    });
    if (!question) return res.status(404).json({ error: 'Free question not found' });
    const score = calculateScore(
      question.scoring_method,
      result.data.selected,
      question.correct_answers,
      question.question_type,
    );
    return res.json({
      ...score,
      correctAnswers: question.correct_answers,
      rationale: question.rationale,
    });
  } catch (error) {
    console.error('Guest answer error:', error);
    return res.status(500).json({ error: 'Unable to grade the answer' });
  }
}

module.exports = { getAvailability, startPreview, submitAnswer };
