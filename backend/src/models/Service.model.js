const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
    {
        tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        name: { type: String, required: true, trim: true },
        description: { type: String },
        duration: { type: Number, required: true }, // in minutes
        price: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        category: { type: String },
        color: { type: String, default: '#6366f1' },
        isActive: { type: Boolean, default: true },
        maxBookingsPerSlot: { type: Number, default: 1 },
    },
    { timestamps: true }
);

serviceSchema.index({ tenantId: 1 });

module.exports = mongoose.model('Service', serviceSchema);
