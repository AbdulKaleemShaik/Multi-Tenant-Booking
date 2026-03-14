const User = require('../models/User.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');


// GET /api/staff
const getStaff = catchAsync(async (req, res, next) => {
    const staff = await User.find({ tenantId: req.user.tenantId, role: 'staff', isActive: true }).select('-password -refreshToken');
    return sendSuccess(res, 200, 'Staff fetched', staff);
});

// POST /api/staff — invite/add staff member
const addStaff = catchAsync(async (req, res, next) => {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    const exists = await User.findOne({ email, tenantId: req.user.tenantId });
    if (exists) return res.status(409).json({ success: false, message: 'Staff with this email already exists' });

    const staff = await User.create({ name, email, password, phone, role: 'staff', tenantId: req.user.tenantId });
    return sendSuccess(res, 201, 'Staff added', staff);
});

// PUT /api/staff/:id
const updateStaff = catchAsync(async (req, res, next) => {
    const allowed = ['name', 'phone', 'avatar', 'isActive'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const staff = await User.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.user.tenantId, role: 'staff' },
        updates,
        { new: true }
    ).select('-password -refreshToken');
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    return sendSuccess(res, 200, 'Staff updated', staff);
});

// DELETE /api/staff/:id (soft delete)
const removeStaff = catchAsync(async (req, res, next) => {
    const staff = await User.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.user.tenantId, role: 'staff' },
        { isActive: false },
        { new: true }
    );
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    return sendSuccess(res, 200, 'Staff removed');
});

module.exports = { getStaff, addStaff, updateStaff, removeStaff };
