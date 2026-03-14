const Service = require('../models/Service.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');


// GET /api/services
const getServices = catchAsync(async (req, res, next) => {
    const tenantId = req.user?.tenantId || req.query.tenantId;
    const services = await Service.find({ tenantId, isActive: true }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Services fetched', services);
});

// POST /api/services
const createService = catchAsync(async (req, res, next) => {
    const { name, description, duration, price, category, color, maxBookingsPerSlot } = req.body;
    if (!name || !duration || !price) return res.status(400).json({ success: false, message: 'Name, duration and price are required' });
    const service = await Service.create({ tenantId: req.user.tenantId, name, description, duration, price, category, color, maxBookingsPerSlot });
    return sendSuccess(res, 201, 'Service created', service);
});

// PUT /api/services/:id
const updateService = catchAsync(async (req, res, next) => {
    const service = await Service.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.user.tenantId },
        req.body,
        { new: true, runValidators: true }
    );
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    return sendSuccess(res, 200, 'Service updated', service);
});

// DELETE /api/services/:id
const deleteService = catchAsync(async (req, res, next) => {
    const service = await Service.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.user.tenantId },
        { isActive: false },
        { new: true }
    );
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    return sendSuccess(res, 200, 'Service deleted');
});

module.exports = { getServices, createService, updateService, deleteService };
