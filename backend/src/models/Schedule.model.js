const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
    {
        tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Sun, 6=Sat
        startTime: { type: String, required: true }, // "09:00"
        endTime: { type: String, required: true },   // "17:00"
        slotDuration: { type: Number, default: 30 }, // minutes
        breakStart: { type: String },                // "13:00"
        breakEnd: { type: String },                  // "14:00"
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

scheduleSchema.index({ tenantId: 1, staffId: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
