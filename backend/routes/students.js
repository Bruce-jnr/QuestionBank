const express = require('express');
const {
  createStudent,
  deleteStudent,
  listStudents,
  resetStudentPassword,
  updateStudent,
} = require('../controllers/studentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.get('/', listStudents);
router.post('/', createStudent);
router.patch('/:id', updateStudent);
router.post('/:id/reset-password', resetStudentPassword);
router.delete('/:id', deleteStudent);

module.exports = router;
