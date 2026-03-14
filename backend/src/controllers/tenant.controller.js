const Tenant = require('../models/Tenant.model');
const User = require('../models/User.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');


const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
    return { accessToken, refreshToken };
};

// POST /api/tenants/onboard — create tenant + tenant admin
const onboardTenant = catchAsync(async (req, res, next) => {
    const { businessName, email, password, phone, description, address, slug } = req.body;
    if (!businessName || !email || !password) {
        return res.status(400).json({ success: false, message: 'Business name, email and password are required' });
    }

    const existingTenant = await Tenant.findOne({ $or: [{ email }, { slug }] });
    if (existingTenant) return res.status(409).json({ success: false, message: 'Tenant with this email or slug already exists' });

    const generatedSlug = slug || businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const tenant = await Tenant.create({ name: businessName, email, phone, description, address, slug: generatedSlug });

    const existingAdmin = await User.findOne({ email, tenantId: tenant._id });
    if (existingAdmin) {
        await Tenant.findByIdAndDelete(tenant._id);
        return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const admin = await User.create({ name: businessName, email, password, phone, role: 'tenant_admin', tenantId: tenant._id });
    const { accessToken, refreshToken } = generateTokens(admin._id);
    admin.refreshToken = refreshToken;
    await admin.save();

    return sendSuccess(res, 201, 'Tenant onboarded successfully', { tenant, admin, accessToken, refreshToken });
});

// GET /api/tenants
const getAllTenants = catchAsync(async (req, res, next) => {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Tenants fetched', tenants);
});

// GET /api/tenants/public/:slug — public info for booking portal
const getTenantBySlug = catchAsync(async (req, res, next) => {
    const tenant = await Tenant.findOne({ slug: req.params.slug, isActive: true }).select('name slug primaryColor logo description address phone');
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    return sendSuccess(res, 200, 'Tenant fetched', tenant);
});

// GET /api/tenants/:id (tenant admin gets own tenant)
const getTenant = catchAsync(async (req, res, next) => {
    const tenantId = req.user.role === 'super_admin' ? req.params.id : req.user.tenantId;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    return sendSuccess(res, 200, 'Tenant fetched', tenant);
});

// PUT /api/tenants/:id
const updateTenant = catchAsync(async (req, res, next) => {
    const tenantId = req.user.role === 'super_admin' ? req.params.id : req.user.tenantId;
    const allowed = ['name', 'phone', 'logo', 'primaryColor', 'description', 'address', 'settings'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const tenant = await Tenant.findByIdAndUpdate(tenantId, updates, { new: true, runValidators: true });
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    return sendSuccess(res, 200, 'Tenant updated', tenant);
});

module.exports = { onboardTenant, getAllTenants, getTenantBySlug, getTenant, updateTenant };
