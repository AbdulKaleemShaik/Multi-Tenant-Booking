const express = require('express');
const router = express.Router();
const { getCreatableRoles } = require('../controllers/role.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/creatable', protect, getCreatableRoles);

module.exports = router;
