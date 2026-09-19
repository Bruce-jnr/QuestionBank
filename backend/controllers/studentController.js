const { z } = require('zod');
const prisma = require('../src/config/database');
const {
  comparePassword,
  generateStudentToken,
  hashPassword,
} = require('../src/config/auth');

const createStudentSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  accessTier: z.enum(['FREE', 'PREMIUM']).default('FREE'),
  premiumUntil: z.string().datetime().nullable().optional(),
});

const updateStudentSchema = z.object({
  name: z.string().trim().min(2).max(255).optional(),
  email: z.string().trim().email().max(255).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  accessTier: z.enum(['FREE', 'PREMIUM']).optional(),
  premiumUntil: z.string().datetime().nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, 'At least one field is required');

const passwordSchema = z.object({ password: z.string().min(8).max(128) });
const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function validationError(res, result) {
  return res.status(400).json({
    error: result.error.issues[0]?.message || 'Invalid request',
  });
}

function publicStudent(student) {
  const premiumActive = student.access_tier === 'PREMIUM'
    && (!student.premium_until || student.premium_until > new Date());
  return {
    id: student.id,
    name: student.full_name,
    email: student.email,
    status: student.status,
    mustChangePassword: student.must_change_password,
    accessTier: premiumActive ? 'PREMIUM' : 'FREE',
    configuredAccessTier: student.access_tier,
    premiumUntil: student.premium_until,
    created_at: student.created_at,
    updated_at: student.updated_at,
    sessionCount: student._count?.exam_sessions,
  };
}

async function loginStudent(req, res) {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result);

  try {
    const student = await prisma.student.findUnique({
      where: { email: result.data.email.toLowerCase() },
    });

    if (!student || !(await comparePassword(result.data.password, student.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (student.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'This student account is disabled' });
    }

    return res.json({
      token: generateStudentToken(student.id, student.email),
      student: publicStudent(student),
    });
  } catch (error) {
    console.error('Student login error:', error);
    return res.status(500).json({ error: 'Unable to sign in' });
  }
}

async function verifyStudent(req, res) {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user.userId } });
    if (!student || student.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Student account is unavailable' });
    }
    return res.json({ valid: true, student: publicStudent(student) });
  } catch (error) {
    console.error('Student verification error:', error);
    return res.status(500).json({ error: 'Unable to verify student session' });
  }
}

async function listStudents(req, res) {
  try {
    const students = await prisma.student.findMany({
      include: { _count: { select: { exam_sessions: true } } },
      orderBy: { created_at: 'desc' },
    });
    return res.json({ students: students.map(publicStudent) });
  } catch (error) {
    console.error('List students error:', error);
    return res.status(500).json({ error: 'Unable to load students' });
  }
}

async function createStudent(req, res) {
  const result = createStudentSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result);

  try {
    const student = await prisma.student.create({
      data: {
        full_name: result.data.name,
        email: result.data.email.toLowerCase(),
        password: await hashPassword(result.data.password),
        access_tier: result.data.accessTier,
        premium_until: result.data.accessTier === 'PREMIUM' && result.data.premiumUntil
          ? new Date(result.data.premiumUntil)
          : null,
        created_by: req.user.userId,
      },
    });
    return res.status(201).json({ student: publicStudent(student) });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A student with this email already exists' });
    }
    console.error('Create student error:', error);
    return res.status(500).json({ error: 'Unable to create student' });
  }
}

async function updateStudent(req, res) {
  const result = updateStudentSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result);

  try {
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: {
        ...(result.data.name ? { full_name: result.data.name } : {}),
        ...(result.data.email ? { email: result.data.email.toLowerCase() } : {}),
        ...(result.data.status ? { status: result.data.status } : {}),
        ...(result.data.accessTier ? { access_tier: result.data.accessTier } : {}),
        ...(result.data.premiumUntil !== undefined
          ? { premium_until: result.data.premiumUntil ? new Date(result.data.premiumUntil) : null }
          : {}),
        ...(result.data.accessTier === 'FREE' ? { premium_until: null } : {}),
      },
    });
    return res.json({ student: publicStudent(student) });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A student with this email already exists' });
    }
    if (error.code === 'P2025') return res.status(404).json({ error: 'Student not found' });
    console.error('Update student error:', error);
    return res.status(500).json({ error: 'Unable to update student' });
  }
}

async function resetStudentPassword(req, res) {
  const result = passwordSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result);

  try {
    await prisma.student.update({
      where: { id: req.params.id },
      data: {
        password: await hashPassword(result.data.password),
        must_change_password: true,
      },
    });
    return res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Student not found' });
    console.error('Reset student password error:', error);
    return res.status(500).json({ error: 'Unable to reset password' });
  }
}

async function deleteStudent(req, res) {
  try {
    await prisma.student.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Student not found' });
    console.error('Delete student error:', error);
    return res.status(500).json({ error: 'Unable to remove student' });
  }
}

module.exports = {
  createStudent,
  deleteStudent,
  listStudents,
  loginStudent,
  resetStudentPassword,
  updateStudent,
  verifyStudent,
};
