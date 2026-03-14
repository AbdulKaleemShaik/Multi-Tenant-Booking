const Role = require('../models/Role.model');
const { sendSuccess } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

// GET /api/roles/creatable
// Returns roles the current user is allowed to assign based on rank
const getCreatableRoles = catchAsync(async (req, res, next) => {
    const userRank = req.user.role?.rank || 5; // Default to lowest rank if not found
    
    // Find all roles with rank >= current user rank
    // Note: Staff member (rank 4) can only assign Staff (4) if they had permission
    // Admin (rank 2) can assign Admin (2), Dashboard (2.5), Manager (3), Staff (4)
    const roles = await Role.find({ rank: { $gte: userRank } }).sort({ rank: 1 });
    
    return sendSuccess(res, 200, 'Roles fetched', roles);
});

module.exports = { getCreatableRoles };
