const express = require('express');
const { getGroupRollup } = require('../controllers/analyticsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/group-rollup', getGroupRollup);

module.exports = router;
