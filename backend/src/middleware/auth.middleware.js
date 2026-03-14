const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { sendError } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 401, 'No token provided');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id)
            .populate('role')
            .select('-password -refreshToken');
        if (!user || !user.isActive) {
            return sendError(res, 401, 'Token invalid or user deactivated');
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return sendError(res, 401, 'Token expired');
        }
        return sendError(res, 401, 'Invalid token');
    }
};

// Optional auth — doesn't block if no token
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id)
            .populate('role')
            .select('-password -refreshToken');
    } catch (_) { }
    next();
};

// Role-based access control
const restrictTo = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user.role?.name;
        if (!roles.includes(userRole)) {
            return sendError(res, 403, 'You do not have permission to perform this action');
        }
        next();
    };
};

module.exports = { protect, optionalAuth, restrictTo };
