const express = require('express');
const router = express.Router();
const { createBooking, getBookings, getBooking, updateBookingStatus } = require('../controllers/booking.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.post('/', protect, createBooking);
router.get('/', protect, getBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/status', protect, authorize('tenant_admin', 'staff', 'super_admin'), updateBookingStatus);

module.exports = router;
