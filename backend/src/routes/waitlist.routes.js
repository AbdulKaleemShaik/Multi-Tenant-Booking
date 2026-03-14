const express = require('express');
const router = express.Router();
const { joinWaitlist, getMyWaitlist, getTenantWaitlist, confirmWaitlistEntry, cancelWaitlistEntry } = require('../controllers/waitlist.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/join', joinWaitlist);
router.get('/me', getMyWaitlist);
router.get('/tenant', getTenantWaitlist);
router.put('/:id/confirm', confirmWaitlistEntry);
router.put('/:id/cancel', cancelWaitlistEntry);

module.exports = router;
