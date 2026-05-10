const express = require('express');
const { chat } = require('../controllers/chatController');

const router = express.Router();

// Public chat endpoint — no auth required so users can chat freely
router.post('/chat', chat);

module.exports = router;
