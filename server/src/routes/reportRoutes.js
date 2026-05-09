const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getReport } = require('../controllers/reportController');

const router = express.Router();

router.get('/:userId', authMiddleware, getReport);

module.exports = router;
