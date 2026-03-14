const StaffAbsence = require('../models/StaffAbsence.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

// POST /api/absences
const createAbsence = catchAsync(async (req, res) => {
    const { staffId, startDate, endDate, startTime, endTime, reason, type } = req.body;
    
    // Authorization: Staff can only book for themselves, Admin for anyone in tenant
    if (req.user.role === 'staff' && req.user._id.toString() !== staffId) {
        return sendError(res, 403, 'Forbidden: You can only book your own absences');
    }

    const absence = await StaffAbsence.create({
        tenantId: req.user.tenantId,
        staffId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime: startTime || '00:00',
        endTime: endTime || '23:59',
        reason,
        type
    });

    return sendSuccess(res, 201, 'Staff absence recorded', absence);
});

// GET /api/absences
const getAbsences = catchAsync(async (req, res) => {
    const query = { tenantId: req.user.tenantId };
    
    if (req.user.role === 'staff') {
        query.staffId = req.user._id;
    } else if (req.query.staffId) {
        query.staffId = req.query.staffId;
    }

    const absences = await StaffAbsence.find(query).sort({ startDate: 1 });
    return sendSuccess(res, 200, 'Absences fetched', absences);
});

// DELETE /api/absences/:id
const deleteAbsence = catchAsync(async (req, res) => {
    const absence = await StaffAbsence.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!absence) return sendError(res, 404, 'Absence not found');

    if (req.user.role === 'staff' && absence.staffId.toString() !== req.user._id.toString()) {
        return sendError(res, 403, 'Forbidden');
    }

    await absence.deleteOne();
    return sendSuccess(res, 200, 'Absence removed');
});

module.exports = { createAbsence, getAbsences, deleteAbsence };
