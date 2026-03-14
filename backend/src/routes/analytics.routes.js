const express = require('express');
const router = express.Router();
const { getOverview } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.get('/overview', protect, authorize('tenant_admin', 'super_admin'), getOverview);

module.exports = router;
