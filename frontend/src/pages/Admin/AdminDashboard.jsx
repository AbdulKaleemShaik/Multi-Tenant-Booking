import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Calendar, Users, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';

const statusConfig = {
    pending: { label: 'Pending', cls: 'badge-warning', dot: 'pending' },
    confirmed: { label: 'Confirmed', cls: 'badge-success', dot: 'confirmed' },
    cancelled: { label: 'Cancelled', cls: 'badge-danger', dot: 'cancelled' },
    completed: { label: 'Completed', cls: 'badge-info', dot: 'completed' },
    no_show: { label: 'No Show', cls: 'badge-gray', dot: 'cancelled' },
};

export default function AdminDashboard() {
    const { user } = useSelector((s) => s.auth);
    const [analytics, setAnalytics] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [aRes, bRes] = await Promise.all([
                    api.get('/analytics/overview'),
                    api.get('/bookings?limit=5'),
                ]);
                setAnalytics(aRes.data.data);
                setBookings(bRes.data.data || []);
            } catch (_) { }
            setLoading(false);
        };
        load();
    }, []);

    const stats = analytics ? [
        { label: 'Total Bookings', value: analytics.stats.totalBookings, icon: Calendar, color: '#6366f1' },
        { label: 'This Month', value: analytics.stats.thisMonthBookings, icon: TrendingUp, color: '#10b981', sub: `${analytics.stats.bookingGrowth > 0 ? '+' : ''}${analytics.stats.bookingGrowth}% vs last month` },
        { label: 'Monthly Revenue', value: `₹${analytics.stats.monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: '#f59e0b' },
        { label: 'Total Customers', value: analytics.stats.totalCustomers, icon: Users, color: '#06b6d4' },
    ] : [];

    if (loading) return (
        <div>
            <div className="page-header"><div className="skeleton" style={{ height: 32, width: 200, borderRadius: 8 }} /></div>
            <div className="grid-4">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}</div>
        </div>
    );

    return (
        <div className="animate-fade">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h2>Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
                    <p>Here's what's happening with your business today.</p>
                </div>
                <Link to="/dashboard/bookings" className="btn btn-primary">View All Bookings</Link>
            </div>

            {/* Stats */}
            <div className="grid-4 mb-6">
                {stats.map(({ label, value, icon: Icon, color, sub }) => (
                    <div key={label} className="stat-card">
                        <div className="stat-icon" style={{ background: `${color}22`, marginBottom: 12 }}>
                            <Icon size={20} color={color} />
                        </div>
                        <div className="stat-value">{value}</div>
                        <div className="stat-label">{label}</div>
                        {sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: 4 }}>{sub}</div>}
                    </div>
                ))}
            </div>

            {/* Summary row */}
            {analytics && (
                <div className="grid-3 mb-6">
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={20} color="#10b981" /></div>
                        <div><div style={{ fontWeight: 700, fontSize: '1.4rem' }}>{analytics.stats.confirmedBookings}</div><div className="text-muted text-sm">Confirmed</div></div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={20} color="#ef4444" /></div>
                        <div><div style={{ fontWeight: 700, fontSize: '1.4rem' }}>{analytics.stats.cancelledBookings}</div><div className="text-muted text-sm">Cancelled</div></div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertCircle size={20} color="var(--color-primary-light)" /></div>
                        <div><div style={{ fontWeight: 700, fontSize: '1.4rem' }}>{analytics.stats.totalBookings - analytics.stats.confirmedBookings - analytics.stats.cancelledBookings}</div><div className="text-muted text-sm">Pending</div></div>
                    </div>
                </div>
            )}

            {/* Recent Bookings */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h3>Recent Bookings</h3>
                    <Link to="/dashboard/bookings" style={{ fontSize: '0.85rem', color: 'var(--color-primary-light)' }}>View all →</Link>
                </div>
                {bookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Calendar size={40} style={{ color: 'var(--color-text-3)', marginBottom: 12 }} />
                        <p>No bookings yet. <Link to={`/book/${user?.tenantId?.slug || user?.tenantId}`}>Share your booking link</Link> to get started.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th>Customer</th><th>Service</th><th>Date & Time</th><th>Amount</th><th>Status</th></tr></thead>
                            <tbody>
                                {bookings.map((b) => {
                                    const sc = statusConfig[b.status] || statusConfig.pending;
                                    return (
                                        <tr key={b._id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{b.customerId?.name || 'N/A'}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>{b.customerId?.email}</div>
                                            </td>
                                            <td>{b.serviceId?.name || 'N/A'}</td>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{b.bookingDate ? format(new Date(b.bookingDate), 'dd MMM yyyy') : '-'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{b.startTime}</div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>₹{b.totalAmount?.toLocaleString()}</td>
                                            <td><span className={`badge ${sc.cls}`}><span className={`status-dot ${sc.dot}`} />{sc.label}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
