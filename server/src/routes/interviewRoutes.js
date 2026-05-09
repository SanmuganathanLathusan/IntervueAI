const express = require('express');
const authMiddleware = require('../middleware/auth');
const { evaluateAnswer, generateQuestions, startInterview } = require('../controllers/interviewController');

const router = express.Router();

router.post('/generate-questions', generateQuestions);
router.post('/start-interview', authMiddleware, startInterview);
router.post('/evaluate-answer', authMiddleware, evaluateAnswer);

module.exports = router;
