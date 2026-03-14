require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Routes
const authRoutes = require('./src/routes/auth.routes');
const tenantRoutes = require('./src/routes/tenant.routes');
const serviceRoutes = require('./src/routes/service.routes');
const staffRoutes = require('./src/routes/staff.routes');
const scheduleRoutes = require('./src/routes/schedule.routes');
const bookingRoutes = require('./src/routes/booking.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');

const app = express();

// 1. Connect DB
connectDB();

// 2. Stripe webhook needs raw body — must come BEFORE express.json
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// 3. Security & Global middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

app.use(express.json()); // Body parser, reading data from body into req.body
app.use(express.urlencoded({ extended: true }));

// 4. Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);

// 5. Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 6. 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

const globalErrorHandler = require('./src/controllers/error.controller');

// 7. Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
