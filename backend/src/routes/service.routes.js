const express = require('express');
const router = express.Router();
const { getServices, createService, updateService, deleteService } = require('../controllers/service.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.get('/', optionalAuth, getServices);
router.post('/', protect, authorize('tenant_admin'), createService);
router.put('/:id', protect, authorize('tenant_admin'), updateService);
router.delete('/:id', protect, authorize('tenant_admin'), deleteService);

module.exports = router;
