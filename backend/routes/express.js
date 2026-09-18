const express = require('express');
const examRoutes = require('./exams');
const questionRoutes = require('./questions');
const studentAuthRoutes = require('./studentAuth');
const studentRoutes = require('./students');

function mountExpressRoutes(app) {
  const json = express.json({ limit: '2mb' });

  app.use('/api/student/auth', json, studentAuthRoutes);
  app.use('/api/students', json, studentRoutes);
  app.use('/api/questions', json, questionRoutes);
  app.use('/api/exam-sessions', json, examRoutes);
}

module.exports = { mountExpressRoutes };
