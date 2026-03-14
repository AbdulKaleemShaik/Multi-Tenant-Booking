const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Public route for validation during booking
router.post('/validate', couponController.validateCoupon);

// Protected routes for management
router.use(protect);
router.use(restrictTo('tenant_admin', 'super_admin'));

router.get('/', couponController.getCoupons);
router.post('/', couponController.createCoupon);
router.delete('/:id', couponController.deleteCoupon);

module.exports = router;
