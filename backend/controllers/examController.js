const { z } = require('zod');
const prisma = require('../src/config/database');
const { calculateScore } = require('../utils/scoringEngine');

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

const startSchema = z.object({
  mode: z.enum(['PRACTICE', 'TEST']),
  clientNeed: z.enum(clientNeeds).nullable().optional(),
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
    content: question.content,
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
        } : null,
      };
    }),
  };
}

async function startSession(req, res) {
  const result = startSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result);

  const where = {
    status: 'PUBLISHED',
    ...(result.data.clientNeed ? { client_need: result.data.clientNeed } : {}),
  };

  try {
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

async function getPerformance(req, res) {
  try {
    const [answers, completedSessions] = await Promise.all([
      prisma.userAnswer.findMany({
        where: { student_id: req.user.userId },
        select: { points_earned: true, points_possible: true },
      }),
      prisma.examSession.count({
        where: { student_id: req.user.userId, is_completed: true },
      }),
    ]);
    const pointsEarned = answers.reduce((sum, answer) => sum + answer.points_earned, 0);
    const pointsPossible = answers.reduce((sum, answer) => sum + answer.points_possible, 0);
    return res.json({
      performance: {
        questionsAnswered: answers.length,
        completedSessions,
        accuracy: pointsPossible ? Math.round((pointsEarned / pointsPossible) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Performance error:', error);
    return res.status(500).json({ error: 'Unable to load performance' });
  }
}

module.exports = {
  finalizeSession,
  getHistory,
  getPerformance,
  getSession,
  startSession,
  submitAnswer,
};
