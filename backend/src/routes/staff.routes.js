const express = require('express');
const router = express.Router();
const { getStaff, addStaff, updateStaff, removeStaff } = require('../controllers/staff.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.get('/', protect, authorize('tenant_admin', 'super_admin'), getStaff);
router.post('/', protect, authorize('tenant_admin'), addStaff);
router.put('/:id', protect, authorize('tenant_admin'), updateStaff);
router.delete('/:id', protect, authorize('tenant_admin'), removeStaff);

module.exports = router;
