const express = require('express');
const { login, getMe, logout } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/logout', logout);

// Authenticated route
router.get('/me', requireAuth, getMe);

module.exports = router;
