const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');

// Public route to get reviews
router.get('/tenant/:tenantId', reviewController.getTenantReviews);

// Protected route to create review
router.post('/', protect, reviewController.createReview);

module.exports = router;
