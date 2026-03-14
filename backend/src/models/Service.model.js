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
        bufferTime: { type: Number, default: 0 }, // Gap in minutes after booking
        addons: [
            {
                name: { type: String, required: true },
                price: { type: Number, required: true },
                duration: { type: Number, default: 0 } // Extra minutes
            }
        ],
        intakeFields: [
            {
                label: { type: String, required: true },
                type: { type: String, enum: ['text', 'textarea', 'select', 'checkbox', 'number'], default: 'text' },
                required: { type: Boolean, default: false },
                options: [String], // for select
                placeholder: { type: String }
            }
        ],
    },
    { timestamps: true }
);

serviceSchema.index({ tenantId: 1 });

module.exports = mongoose.model('Service', serviceSchema);
