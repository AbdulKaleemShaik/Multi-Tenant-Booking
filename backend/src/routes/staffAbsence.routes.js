const express = require('express');
const router = express.Router();
const { createAbsence, getAbsences, deleteAbsence } = require('../controllers/staffAbsence.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', restrictTo('staff', 'tenant_admin'), createAbsence);
router.get('/', restrictTo('staff', 'tenant_admin'), getAbsences);
router.delete('/:id', restrictTo('staff', 'tenant_admin'), deleteAbsence);

module.exports = router;
