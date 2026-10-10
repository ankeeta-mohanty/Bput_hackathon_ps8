const express = require('express');
const { getSites } = require('../controllers/siteController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/sites is now secured by RBAC
router.get('/', requireAuth, getSites);

module.exports = router;
