const express = require('express');
const {
  getSubmissions,
  getSubmissionById,
  createOrUpdateDraft,
  submitForReview,
  reviewSubmission,
} = require('../controllers/submissionController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', getSubmissions);
router.get('/:id', getSubmissionById);
router.post('/', createOrUpdateDraft);
router.post('/:id/submit', submitForReview);
router.post('/:id/review', reviewSubmission);

module.exports = router;
