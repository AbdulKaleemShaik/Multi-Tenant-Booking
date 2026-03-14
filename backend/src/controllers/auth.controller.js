const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Tenant = require('../models/Tenant.model');
const Role = require('../models/Role.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');


const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return { accessToken, refreshToken };
};

// POST /api/auth/register (customer self-registration under a tenant)
const register = catchAsync(async (req, res, next) => {
    const { name, email, password, phone, tenantSlug } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    let tenantId = null;
    if (tenantSlug) {
        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
        tenantId = tenant._id;
    }

    const existingUser = await User.findOne({ email, tenantId });
    if (existingUser) return res.status(409).json({ success: false, message: 'Email already registered' });

    const customerRole = await Role.findOne({ name: 'customer' });
    const user = await User.create({ name, email, password, phone, tenantId, role: customerRole._id });
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    return sendSuccess(res, 201, 'Registration successful', { accessToken, refreshToken, user });
});

// POST /api/auth/login
const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account is deactivated' });

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    // Populate role before sending back
    await user.populate('role');

    return sendSuccess(res, 200, 'Login successful', { accessToken, refreshToken, user });
});

// POST /api/auth/refresh
const refresh = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        const tokens = generateTokens(user._id);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return sendSuccess(res, 200, 'Token refreshed', tokens);
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
});

// POST /api/auth/logout
const logout = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    user.refreshToken = null;
    await user.save();
    return sendSuccess(res, 200, 'Logged out successfully');
});

// GET /api/auth/me
const getMe = catchAsync(async (req, res, next) => {
    return sendSuccess(res, 200, 'User fetched', req.user);
});

module.exports = { register, login, refresh, logout, getMe };
