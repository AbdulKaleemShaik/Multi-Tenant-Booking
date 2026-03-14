const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: true,
        },
        value: {
            type: Number,
            required: true,
        },
        minBookingAmount: {
            type: Number,
            default: 0,
        },
        expiryDate: {
            type: Date,
            required: true,
        },
        usageLimit: {
            type: Number,
            default: null, // null means unlimited
        },
        usedCount: {
            type: Number,
            default: 0,
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Unique code per tenant
couponSchema.index({ code: 1, tenantId: 1 }, { unique: true });

module.exports = mongoose.model('Coupon', couponSchema);
