const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema(
    {
        tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, can be for any staff
        date: { type: Date, required: true },
        status: { 
            type: String, 
            enum: ['waiting', 'notified', 'booked', 'expired'], 
            default: 'waiting' 
        },
        notifiedAt: { type: Date }
    },
    { timestamps: true }
);

waitlistSchema.index({ tenantId: 1, date: 1, status: 1 });
waitlistSchema.index({ customerId: 1 });

module.exports = mongoose.model('Waitlist', waitlistSchema);
