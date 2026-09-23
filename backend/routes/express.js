const express = require('express');
const authRoutes = require('./auth');
const { uploadFile } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');
const examRoutes = require('./exams');
const questionRoutes = require('./questions');
const studentAuthRoutes = require('./studentAuth');
const studentRoutes = require('./students');
const contactRoutes = require('./contact');
const guestQuestionRoutes = require('./guestQuestions');
const { publicRouter: publicStudyRoutes, adminRouter: adminStudyRoutes } = require('./studyContent');

function mountExpressRoutes(app) {
  const json = express.json({ limit: '2mb' });

  app.use('/api/auth', json, authRoutes);
  app.post('/api/upload', authenticateToken, uploadFile);
  app.use('/api/student/auth', json, studentAuthRoutes);
  app.use('/api/public/contact', json, contactRoutes);
  app.use('/api/public/question-preview', json, guestQuestionRoutes);
  app.use('/api/public/study-guide', json, publicStudyRoutes);
  app.use('/api/study-content', json, adminStudyRoutes);
  app.use('/api/students', json, studentRoutes);
  app.use('/api/questions', json, questionRoutes);
  app.use('/api/exam-sessions', json, examRoutes);
}

module.exports = { mountExpressRoutes };
