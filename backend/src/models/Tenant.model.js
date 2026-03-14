const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        phone: { type: String },
        logo: { type: String },
        primaryColor: { type: String, default: '#6366f1' },
        description: { type: String },
        address: { type: String },
        isActive: { type: Boolean, default: true },
        plan: { type: String, enum: ['free', 'starter', 'pro'], default: 'free' },
        stripeCustomerId: { type: String },
        subscriptionStatus: { type: String, enum: ['active', 'inactive', 'trial'], default: 'trial' },
        settings: {
            bookingLeadTime: { type: Number, default: 60 },      // minutes before booking can be made
            bookingWindow: { type: Number, default: 30 },         // days in advance booking is allowed
            cancellationPolicy: { type: Number, default: 24 },    // hours before to allow cancellation
            emailNotifications: { type: Boolean, default: true },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Tenant', tenantSchema);
