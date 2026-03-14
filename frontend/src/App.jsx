import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Onboard from './pages/Auth/Onboard';

// Dashboard Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import ServicesPage from './pages/Admin/ServicesPage';
import StaffPage from './pages/Admin/StaffPage';
import SchedulePage from './pages/Admin/SchedulePage';
import AnalyticsPage from './pages/Admin/AnalyticsPage';
import BookingsPage from './pages/Admin/BookingsPage';
import SettingsPage from './pages/Admin/SettingsPage';

// Staff Pages
import StaffDashboard from './pages/Staff/StaffDashboard';

// Super Admin
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard';

// Public Booking
import BookingPortal from './pages/Booking/BookingPortal';
import BookingConfirm from './pages/Booking/BookingConfirm';

// Landing
import Landing from './pages/Landing';

// Route Guards
const ProtectedRoute = ({ children, roles }) => {
    const { isAuthenticated, user } = useSelector((s) => s.auth);
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user?.role)) return <Navigate to="/unauthorized" replace />;
    return children;
};

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/onboard" element={<Onboard />} />
                <Route path="/book/:tenantSlug" element={<BookingPortal />} />
                <Route path="/book/:tenantSlug/confirm" element={<BookingConfirm />} />

                {/* Tenant Admin */}
                <Route path="/dashboard" element={
                    <ProtectedRoute roles={['tenant_admin']}>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="services" element={<ServicesPage />} />
                    <Route path="staff" element={<StaffPage />} />
                    <Route path="schedules" element={<SchedulePage />} />
                    <Route path="bookings" element={<BookingsPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Staff */}
                <Route path="/staff-dashboard" element={
                    <ProtectedRoute roles={['staff']}>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<StaffDashboard />} />
                    <Route path="bookings" element={<BookingsPage />} />
                </Route>

                {/* Super Admin */}
                <Route path="/sadmin" element={
                    <ProtectedRoute roles={['super_admin']}>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<SuperAdminDashboard />} />
                </Route>

                <Route path="/unauthorized" element={
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
                        <h2>403 – Unauthorized</h2>
                        <p style={{ color: 'var(--color-text-2)' }}>You don't have permission to view this page.</p>
                        <a href="/" className="btn btn-primary">Go Home</a>
                    </div>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
