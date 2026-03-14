const express = require('express');
const router = express.Router();
const { onboardTenant, getAllTenants, getTenantBySlug, getTenant, updateTenant } = require('../controllers/tenant.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.post('/onboard', onboardTenant);
router.get('/public/:slug', getTenantBySlug);
router.get('/me', protect, authorize('tenant_admin', 'super_admin'), getTenant);
router.get('/', protect, authorize('super_admin'), getAllTenants);
router.get('/:id', protect, authorize('super_admin', 'tenant_admin'), getTenant);
router.put('/:id', protect, authorize('super_admin', 'tenant_admin'), updateTenant);

module.exports = router;
