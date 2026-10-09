const express = require('express');
const router = express.Router();
const { getSites } = require('../controllers/siteController');

// GET /api/sites
router.get('/', getSites);

module.exports = router;
