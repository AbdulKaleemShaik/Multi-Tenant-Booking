const User = require('../models/User.model');
const Role = require('../models/Role.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');


// GET /api/staff
const getStaff = catchAsync(async (req, res, next) => {
    // Find roles for staff and manager
    const roles = await Role.find({ name: { $in: ['staff', 'manager', 'dashboard', 'tenant_admin'] } });
    const roleIds = roles.map(r => r._id);

    const query = { 
        tenantId: req.user.tenantId, 
        role: { $in: roleIds }, 
        isActive: true 
    };

    // If manager, only show those who report to them
    if (req.user.role.name === 'manager') {
        query.reportsTo = req.user._id;
    }

    const staff = await User.find(query)
    .populate('role')
    .populate('reportsTo', 'name email')
    .select('-password -refreshToken');
    
    return sendSuccess(res, 200, 'Staff fetched', staff);
});

// POST /api/staff — invite/add staff member
const addStaff = catchAsync(async (req, res, next) => {
    const { name, email, password, phone, role, reportsTo } = req.body; // role here is the role name (e.g. 'staff')
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    const targetRole = await Role.findOne({ name: role || 'staff' });
    if (!targetRole) return res.status(400).json({ success: false, message: 'Invalid role' });

    // Hierarchy check: Current user rank must be <= target role rank
    const currentUserRank = req.user.role?.rank || 5;
    if (currentUserRank > targetRole.rank) {
        return res.status(403).json({ success: false, message: 'You cannot assign a role higher than your own' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'User with this email already exists' });

    const staff = await User.create({ 
        name, email, password, phone, 
        role: targetRole._id, 
        tenantId: req.user.tenantId,
        reportsTo: reportsTo || null
    });
    return sendSuccess(res, 201, 'Team member added', staff);
});

// PUT /api/staff/:id
const updateStaff = catchAsync(async (req, res, next) => {
    const allowed = ['name', 'phone', 'avatar', 'isActive', 'role', 'reportsTo'];
    const updates = {};
    
    if (req.body.role) {
        const targetRole = await Role.findOne({ name: req.body.role });
        if (!targetRole) return res.status(400).json({ success: false, message: 'Invalid role' });
        
        // Hierarchy check
        const currentUserRank = req.user.role?.rank || 5;
        if (currentUserRank > targetRole.rank) {
            return res.status(403).json({ success: false, message: 'You cannot assign a role higher than your own' });
        }
        updates.role = targetRole._id;
    }

    const filteredFields = ['name', 'phone', 'avatar', 'isActive', 'reportsTo'];
    filteredFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const staff = await User.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.user.tenantId },
        updates,
        { returnDocument: 'after' }
    ).populate('role').select('-password -refreshToken');
    
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    return sendSuccess(res, 200, 'Staff updated', staff);
});

// DELETE /api/staff/:id (soft delete)
const removeStaff = catchAsync(async (req, res, next) => {
    const { getUserPoolCriteria } = require('../utils/userUtils');
    const poolCriteria = await getUserPoolCriteria(req.user);

    const query = { _id: req.params.id, tenantId: req.user.tenantId };
    
    // If pool is restricted (e.g. manager), ensure they are in authorized pool
    if (poolCriteria) {
        const poolArray = Array.isArray(poolCriteria) ? poolCriteria : [poolCriteria];
        const isInPool = poolArray.includes(req.params.id) || (poolCriteria.$in && poolCriteria.$in.map(id => id.toString()).includes(req.params.id));
        
        if (!isInPool) {
            return sendError(res, 403, 'You do not have permission to remove this staff member');
        }
    }

    const staff = await User.findOneAndUpdate(
        query,
        { isActive: false },
        { new: true }
    );

    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    return sendSuccess(res, 200, 'Staff removed');
});

module.exports = { getStaff, addStaff, updateStaff, removeStaff };
