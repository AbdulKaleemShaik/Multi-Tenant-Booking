const express = require('express');
const router = express.Router();
const { getSchedules, createSchedule, updateSchedule, deleteSchedule, getAvailableSlots } = require('../controllers/schedule.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.get('/available-slots', getAvailableSlots); // public — for booking portal
router.get('/', protect, authorize('tenant_admin', 'staff'), getSchedules);
router.post('/', protect, authorize('tenant_admin'), createSchedule);
router.put('/:id', protect, authorize('tenant_admin'), updateSchedule);
router.delete('/:id', protect, authorize('tenant_admin'), deleteSchedule);

module.exports = router;
