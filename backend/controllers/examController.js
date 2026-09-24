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
  mode: z.enum(['PRACTICE', 'TEST']),
  clientNeed: z.enum(clientNeeds).nullable().optional(),
  questionType: z.enum(questionTypes).nullable().optional(),
  questionCount: z.coerce.number().int().min(1).max(85),
});

const answerSchema = z.object({
  questionId: z.string().uuid(),
  selected: z.array(z.string()).min(1),
  timeSpentSec: z.coerce.number().int().min(0).max(86400).default(0),
});

function shuffle(values) {
  const items = [...values];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [items[index], items[target]] = [items[target], items[index]];
  }
  return items;
}

function exposedQuestion(question, revealAnswers = false) {
  return {
    id: question.id,
    stem: question.stem,
    prompt: question.prompt,
    options: question.options,
    content: questionContentWithMedia(question.content),
    clientNeed: question.client_need,
    questionType: question.question_type,
    ...(revealAnswers ? {
      correctAnswers: question.correct_answers,
      rationale: question.rationale,
    } : {}),
  };
}

function validationError(res, result) {
  return res.status(400).json({ error: result.error.issues[0]?.message || 'Invalid request' });
}

async function loadOwnedSession(sessionId, studentId) {
  return prisma.examSession.findFirst({
    where: { id: sessionId, student_id: studentId },
    include: {
      session_questions: {
        orderBy: { position: 'asc' },
        include: { question: true },
      },
      answers: true,
    },
  });
}

function sessionPayload(session) {
  const answers = new Map(session.answers.map((answer) => [answer.question_id, answer]));
  return {
    id: session.id,
    mode: session.mode,
    clientNeed: session.client_need,
    isCompleted: session.is_completed,
    score: session.score,
    maxScore: session.max_score,
    timeSpentSec: session.time_spent_sec,
    questionCount: session.question_count,
    createdAt: session.created_at,
    completedAt: session.completed_at,
    questions: session.session_questions.map(({ position, question }) => {
      const answer = answers.get(question.id);
      const reveal = session.is_completed || (session.mode === 'PRACTICE' && Boolean(answer));
      return {
        ...exposedQuestion(question, reveal),
        position,
        answer: answer ? {
          selected: answer.selected,
          isCorrect: reveal ? answer.is_correct : undefined,
          pointsEarned: reveal ? answer.points_earned : undefined,
          pointsPossible: reveal ? answer.points_possible : undefined,
          timeSpentSec: answer.time_spent_sec,
        } : null,
      };
    }),
  };
}

async function startSession(req, res) {
  const result = startSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result);

  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.userId },
      select: { access_tier: true, premium_until: true, status: true },
    });
    if (!student || student.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Student account is unavailable' });
    }
    const hasPremium = student.access_tier === 'PREMIUM'
      && (!student.premium_until || student.premium_until > new Date());
    const where = {
      status: 'PUBLISHED',
      ...(!hasPremium ? { access_tier: 'FREE' } : {}),
      ...(result.data.clientNeed ? { client_need: result.data.clientNeed } : {}),
      ...(result.data.questionType ? { question_type: result.data.questionType } : {}),
    };
    const available = await prisma.question.findMany({ where, select: { id: true } });
    const selected = shuffle(available).slice(0, result.data.questionCount);
    if (!selected.length) {
      return res.status(409).json({ error: 'No published questions are available for this selection' });
    }

    const session = await prisma.examSession.create({
      data: {
        student_id: req.user.userId,
        mode: result.data.mode,
        client_need: result.data.clientNeed || null,
        question_count: selected.length,
        session_questions: {
          create: selected.map(({ id }, index) => ({ question_id: id, position: index + 1 })),
        },
      },
    });
    return res.status(201).json({
      session: {
        id: session.id,
        mode: session.mode,
        questionCount: session.question_count,
      },
    });
  } catch (error) {
    console.error('Start session error:', error);
    return res.status(500).json({ error: 'Unable to start a study session' });
  }
}

async function getSession(req, res) {
  try {
    const session = await loadOwnedSession(req.params.id, req.user.userId);
    if (!session) return res.status(404).json({ error: 'Study session not found' });
    return res.json({ session: sessionPayload(session) });
  } catch (error) {
    console.error('Get session error:', error);
    return res.status(500).json({ error: 'Unable to load the study session' });
  }
}

async function submitAnswer(req, res) {
  const result = answerSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result);

  try {
    const session = await prisma.examSession.findFirst({
      where: { id: req.params.id, student_id: req.user.userId },
    });
    if (!session) return res.status(404).json({ error: 'Study session not found' });
    if (session.is_completed) return res.status(409).json({ error: 'This session is already complete' });

    const sessionQuestion = await prisma.examSessionQuestion.findUnique({
      where: {
        exam_session_id_question_id: {
          exam_session_id: session.id,
          question_id: result.data.questionId,
        },
      },
      include: { question: true },
    });
    if (!sessionQuestion) return res.status(400).json({ error: 'Question does not belong to this session' });

    const score = calculateScore(
      sessionQuestion.question.scoring_method,
      result.data.selected,
      sessionQuestion.question.correct_answers,
      sessionQuestion.question.question_type,
    );
    const answer = await prisma.userAnswer.upsert({
      where: {
        exam_session_id_question_id: {
          exam_session_id: session.id,
          question_id: result.data.questionId,
        },
      },
      create: {
        student_id: req.user.userId,
        exam_session_id: session.id,
        question_id: result.data.questionId,
        selected: result.data.selected,
        is_correct: score.isCorrect,
        points_earned: score.pointsEarned,
        points_possible: score.pointsPossible,
        time_spent_sec: result.data.timeSpentSec,
      },
      update: {
        selected: result.data.selected,
        is_correct: score.isCorrect,
        points_earned: score.pointsEarned,
        points_possible: score.pointsPossible,
        time_spent_sec: result.data.timeSpentSec,
      },
    });

    if (session.mode === 'PRACTICE') {
      return res.json({
        answer: {
          selected: answer.selected,
          isCorrect: answer.is_correct,
          pointsEarned: answer.points_earned,
          pointsPossible: answer.points_possible,
          correctAnswers: sessionQuestion.question.correct_answers,
          rationale: sessionQuestion.question.rationale,
        },
      });
    }

    return res.json({ answer: { selected: answer.selected, saved: true } });
  } catch (error) {
    console.error('Submit answer error:', error);
    return res.status(500).json({ error: 'Unable to save the answer' });
  }
}

async function finalizeSession(req, res) {
  try {
    const session = await loadOwnedSession(req.params.id, req.user.userId);
    if (!session) return res.status(404).json({ error: 'Study session not found' });
    if (session.is_completed) return res.json({ session: sessionPayload(session) });

    const score = session.answers.reduce((sum, answer) => sum + answer.points_earned, 0);
    const answeredScores = new Map(
      session.answers.map((answer) => [answer.question_id, answer.points_possible]),
    );
    const maxScore = session.session_questions.reduce((sum, item) => {
      if (answeredScores.has(item.question_id)) return sum + answeredScores.get(item.question_id);
      return sum + calculateScore(
        item.question.scoring_method,
        [],
        item.question.correct_answers,
        item.question.question_type,
      ).pointsPossible;
    }, 0);
    const timeSpentSec = session.answers.reduce((sum, answer) => sum + answer.time_spent_sec, 0);

    await prisma.examSession.update({
      where: { id: session.id },
      data: {
        is_completed: true,
        score,
        max_score: maxScore,
        time_spent_sec: timeSpentSec,
        completed_at: new Date(),
      },
    });

    const completed = await loadOwnedSession(session.id, req.user.userId);
    return res.json({ session: sessionPayload(completed) });
  } catch (error) {
    console.error('Finalize session error:', error);
    return res.status(500).json({ error: 'Unable to complete the session' });
  }
}

async function getHistory(req, res) {
  try {
    const sessions = await prisma.examSession.findMany({
      where: { student_id: req.user.userId },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
    return res.json({ sessions: sessions.map((session) => ({
      id: session.id,
      mode: session.mode,
      clientNeed: session.client_need,
      isCompleted: session.is_completed,
      score: session.score,
      maxScore: session.max_score,
      questionCount: session.question_count,
      createdAt: session.created_at,
      completedAt: session.completed_at,
    })) });
  } catch (error) {
    console.error('Session history error:', error);
    return res.status(500).json({ error: 'Unable to load session history' });
  }
}

async function deleteSession(req, res) {
  const sessionId = z.string().uuid().safeParse(req.params.id);
  if (!sessionId.success) return res.status(400).json({ error: 'Invalid session ID' });

  try {
    const deleted = await prisma.examSession.deleteMany({
      where: { id: sessionId.data, student_id: req.user.userId },
    });
    if (!deleted.count) return res.status(404).json({ error: 'Study session not found' });
    return res.json({ message: 'Study session deleted' });
  } catch (error) {
    console.error('Delete session error:', error);
    return res.status(500).json({ error: 'Unable to delete the study session' });
  }
}

async function getPerformance(req, res) {
  try {
    const [answers, completedSessions] = await Promise.all([
      prisma.userAnswer.findMany({
        where: { student_id: req.user.userId },
        select: { points_earned: true, points_possible: true, time_spent_sec: true, question: { select: { client_need: true } } },
      }),
      prisma.examSession.count({
        where: { student_id: req.user.userId, is_completed: true },
      }),
    ]);
    const pointsEarned = answers.reduce((sum, answer) => sum + answer.points_earned, 0);
    const pointsPossible = answers.reduce((sum, answer) => sum + answer.points_possible, 0);
    const categoryMap = new Map();
    answers.forEach((answer) => {
      const key = answer.question.client_need;
      const current = categoryMap.get(key) || { answered: 0, earned: 0, possible: 0 };
      current.answered += 1;
      current.earned += answer.points_earned;
      current.possible += answer.points_possible;
      categoryMap.set(key, current);
    });
    return res.json({
      performance: {
        questionsAnswered: answers.length,
        completedSessions,
        accuracy: pointsPossible ? Math.round((pointsEarned / pointsPossible) * 100) : 0,
        timeSpentSec: answers.reduce((sum, answer) => sum + answer.time_spent_sec, 0),
        categories: [...categoryMap.entries()].map(([clientNeed, values]) => ({
          clientNeed,
          answered: values.answered,
          accuracy: values.possible ? Math.round((values.earned / values.possible) * 100) : 0,
        })),
      },
    });
  } catch (error) {
    console.error('Performance error:', error);
    return res.status(500).json({ error: 'Unable to load performance' });
  }
}

async function getAvailability(req, res) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.userId },
      select: { access_tier: true, premium_until: true, status: true },
    });
    if (!student || student.status !== 'ACTIVE') return res.status(403).json({ error: 'Student account is unavailable' });
    const hasPremium = student.access_tier === 'PREMIUM'
      && (!student.premium_until || student.premium_until > new Date());
    const groups = await prisma.question.groupBy({
      by: ['client_need', 'question_type', 'access_tier'],
      where: { status: 'PUBLISHED' },
      _count: { id: true },
    });
    const summarize = (clientNeed = null, questionType = null) => {
      const matching = groups.filter((group) => (
        (!clientNeed || group.client_need === clientNeed)
        && (!questionType || group.question_type === questionType)
      ));
      const free = matching.filter((group) => group.access_tier === 'FREE').reduce((sum, group) => sum + group._count.id, 0);
      const premium = matching.filter((group) => group.access_tier === 'PREMIUM').reduce((sum, group) => sum + group._count.id, 0);
      return { free, premium, total: free + premium, available: hasPremium ? free + premium : free, locked: hasPremium ? 0 : premium };
    };
    return res.json({
      accessTier: hasPremium ? 'PREMIUM' : 'FREE',
      mixed: summarize(),
      topics: Object.fromEntries(clientNeeds.map((clientNeed) => [clientNeed, summarize(clientNeed)])),
      questionTypes: Object.fromEntries(questionTypes.map((questionType) => [questionType, summarize(null, questionType)])),
      filters: Object.fromEntries(clientNeeds.map((clientNeed) => [
        clientNeed,
        Object.fromEntries(questionTypes.map((questionType) => [questionType, summarize(clientNeed, questionType)])),
      ])),
    });
  } catch (error) {
    console.error('Question availability error:', error);
    return res.status(500).json({ error: 'Unable to load question availability' });
  }
}

module.exports = {
  deleteSession,
  finalizeSession,
  getHistory,
  getAvailability,
  getPerformance,
  getSession,
  startSession,
  submitAnswer,
};
