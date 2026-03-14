const User = require('../models/User.model');

/**
 * Recursively find all users who report to the given userId (descendants).
 * @param {string} userId 
 * @returns {Promise<string[]>} List of user IDs
 */
const getDescendants = async (userId) => {
    const directReports = await User.find({ reportsTo: userId }).distinct('_id');
    let descendants = [...directReports];

    for (const reportId of directReports) {
        const subDescendants = await getDescendants(reportId);
        descendants = descendants.concat(subDescendants);
    }

    return descendants;
};

/**
 * Returns the pool of staff IDs that the user is authorized to view/manage.
 * @param {Object} user - The logged in user object (req.user)
 * @returns {Promise<Object|null>} Mongoose query filter for staffId, or null if all staff in tenant are allowed
 */
const getUserPoolCriteria = async (user) => {
    const roleName = user.role?.name;

    if (['super_admin', 'tenant_admin', 'dashboard'].includes(roleName)) {
        return null; // Full visibility within tenant (caller should still filter by tenantId)
    }

    if (roleName === 'manager') {
        const descendants = await getDescendants(user._id);
        return { $in: [user._id, ...descendants] };
    }

    if (roleName === 'staff') {
        return user._id;
    }

    return user._id; // Default fallback for customers too
};

module.exports = { getDescendants, getUserPoolCriteria };
