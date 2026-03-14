const mongoose = require('mongoose');

const staffAbsenceSchema = new mongoose.Schema(
    {
        tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        startTime: { type: String, default: '00:00' }, // "09:00"
        endTime: { type: String, default: '23:59' },   // "17:00"
        reason: { type: String },
        type: { 
            type: String, 
            enum: ['vacation', 'sick', 'personal', 'other'], 
            default: 'vacation' 
        }
    },
    { timestamps: true }
);

staffAbsenceSchema.index({ tenantId: 1, staffId: 1, startDate: 1 });

module.exports = mongoose.model('StaffAbsence', staffAbsenceSchema);
