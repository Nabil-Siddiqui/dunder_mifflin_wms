// ============================================================
// Auth Routes
// ============================================================
// Public routes — no authMiddleware needed here, since logging
// in is how a user obtains a token in the first place.
// ============================================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;