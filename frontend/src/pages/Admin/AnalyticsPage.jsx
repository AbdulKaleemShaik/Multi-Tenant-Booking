import { useEffect, useState } from 'react';
import api from '../../services/api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', marginBottom: 4 }}>{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color, fontWeight: 600, fontSize: '0.9rem' }}>
                    {p.dataKey === 'revenue' ? `₹${p.value?.toLocaleString()}` : p.value} {p.name}
                </p>
            ))}
        </div>
    );
};

export default function AnalyticsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics/overview').then(r => setData(r.data.data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 250, borderRadius: 16 }} />)}</div>;

    const { stats, topServices, bookingsByDay } = data || {};
    const growth = stats?.bookingGrowth;

    return (
        <div className="animate-fade">
            <div className="page-header">
                <h2>Analytics</h2>
                <p>Track performance, revenue, and booking trends</p>
            </div>

            {/* KPI Cards */}
            <div className="grid-4 mb-6">
                {[
                    { label: 'Total Bookings', value: stats?.totalBookings, color: '#6366f1' },
                    { label: 'Monthly Revenue', value: `₹${stats?.monthlyRevenue?.toLocaleString()}`, color: '#10b981' },
                    { label: 'Total Customers', value: stats?.totalCustomers, color: '#06b6d4' },
                    { label: 'Cancellation Rate', value: `${stats?.totalBookings > 0 ? Math.round((stats?.cancelledBookings / stats?.totalBookings) * 100) : 0}%`, color: '#f59e0b' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="stat-card">
                        <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{value}</div>
                        <div style={{ color: 'var(--color-text-2)', fontSize: '0.85rem', marginTop: 4 }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Monthly growth badge */}
            <div className="card mb-6" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {growth >= 0 ? <TrendingUp size={24} color="#10b981" /> : <TrendingDown size={24} color="#ef4444" />}
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.3rem', color: growth >= 0 ? '#10b981' : '#ef4444' }}>{growth >= 0 ? '+' : ''}{growth}%</div>
                        <div style={{ color: 'var(--color-text-2)', fontSize: '0.85rem' }}>Booking growth vs last month</div>
                    </div>
                </div>
                <div className="divider" style={{ width: 1, height: 48, margin: '0 16px' }} />
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-2)' }}>
                    <strong style={{ color: 'var(--color-text)', fontSize: '1.1rem' }}>{stats?.thisMonthBookings}</strong> bookings this month vs <strong style={{ color: 'var(--color-text)' }}>{stats?.lastMonthBookings}</strong> last month
                </div>
            </div>

            {/* Charts row */}
            <div className="grid-2 mb-6">
                {/* Bookings over time */}
                <div className="card">
                    <h3 style={{ marginBottom: 20 }}>Bookings (Last 30 days)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={bookingsByDay}>
                            <defs>
                                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="_id" tick={{ fill: 'var(--color-text-3)', fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                            <YAxis tick={{ fill: 'var(--color-text-3)', fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#colorBookings)" name="bookings" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue over time */}
                <div className="card">
                    <h3 style={{ marginBottom: 20 }}>Revenue (Last 30 days)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={bookingsByDay}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="_id" tick={{ fill: 'var(--color-text-3)', fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                            <YAxis tick={{ fill: 'var(--color-text-3)', fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#colorRevenue)" name="revenue" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Services */}
            <div className="grid-2">
                <div className="card">
                    <h3 style={{ marginBottom: 20 }}>Top Services</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={topServices} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                            <XAxis type="number" tick={{ fill: 'var(--color-text-3)', fontSize: 11 }} />
                            <YAxis type="category" dataKey="name" tick={{ fill: 'var(--color-text-2)', fontSize: 11 }} width={100} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" name="bookings" radius={[0, 6, 6, 0]}>
                                {topServices?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: 20 }}>Service Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={topServices} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                                {topServices?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: 'var(--color-text-2)', fontSize: '0.8rem' }}>{v}</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
