const express = require('express');
const router = express.Router();
const { createCheckoutSession, stripeWebhook, refundPayment, getPayments } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

// Stripe requires raw body for webhook signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
router.post('/checkout', protect, createCheckoutSession);
router.post('/refund', protect, authorize('tenant_admin', 'super_admin'), refundPayment);
router.get('/', protect, authorize('tenant_admin', 'super_admin'), getPayments);

module.exports = router;
