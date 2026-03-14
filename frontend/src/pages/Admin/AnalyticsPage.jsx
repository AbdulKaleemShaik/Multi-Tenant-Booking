import { useEffect, useState } from 'react';
import api from '../../services/api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Clock, TrendingUp, TrendingDown, Filter, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

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
    const [filters, setFilters] = useState({
        startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.set('startDate', filters.startDate);
            if (filters.endDate) params.set('endDate', filters.endDate);
            
            const r = await api.get(`/analytics/overview?${params}`);
            setData(r.data.data);
        } catch (_) { }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [filters]);


    if (loading && !data) return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 250, borderRadius: 16 }} />)}</div>;

    const { stats, topServices, bookingsByDay, staffPerformance, couponStats } = data || {};
    const growth = stats?.bookingGrowth || 0;

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div className="page-header" style={{ margin: 0 }}>
                    <h2>Analytics</h2>
                    <p>Track performance, revenue, and booking trends</p>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--color-surface)', padding: '8px 16px', borderRadius: 16, border: '1px solid var(--color-border)' }}>
                    <Calendar size={16} color="var(--color-primary-light)" />
                    <input 
                        type="date" 
                        value={filters.startDate} 
                        onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                    />
                    <span style={{ color: 'var(--color-text-3)' }}>to</span>
                    <input 
                        type="date" 
                        value={filters.endDate} 
                        onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid-4 mb-6" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {[
                    { label: 'Total Bookings', value: stats?.totalBookings, color: '#6366f1' },
                    { label: 'Completed', value: stats?.completedBookings, color: '#10b981' },
                    { label: 'Missed', value: stats?.missedBookings, color: '#ef4444' },
                    { label: 'Monthly Revenue', value: `₹${Number(stats?.monthlyRevenue || 0).toLocaleString()}`, color: '#06b6d4' },
                    { label: 'Promo Discounts', value: `₹${Number(couponStats?.totalDiscount || 0).toLocaleString()}`, color: '#f59e0b' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="stat-card">
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
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

            {/* Staff Performance Leaderboard */}
            <div className="card mt-6">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem' }}>Staff Performance Leaderboard</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-3)', marginTop: 4 }}>Compare reliability and revenue across your team</p>
                    </div>
                </div>
                
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="table">
                        <thead>
                            <tr style={{ background: 'transparent' }}>
                                <th>Personnel</th>
                                <th style={{ textAlign: 'center' }}>Total Appts</th>
                                <th style={{ textAlign: 'center' }}>Completed</th>
                                <th style={{ textAlign: 'center' }}>Missed</th>
                                <th style={{ textAlign: 'center' }}>Reliability</th>
                                <th style={{ textAlign: 'right' }}>Revenue Generated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffPerformance?.map((s) => (
                                <tr key={s._id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{s.email}</div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{s.totalBookings}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{s.completed}</span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{s.missed}</span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                            <div style={{ width: 60, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                                                <div style={{ width: `${s.reliabilityScore}%`, height: '100%', background: s.reliabilityScore > 80 ? 'var(--color-success)' : s.reliabilityScore > 50 ? 'var(--color-warning)' : 'var(--color-danger)' }} />
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{s.reliabilityScore?.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                                        ₹{s.revenue?.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Visual breakdown chart */}
            <div className="card mt-6">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3>Reliability Trend (Completed vs Missed)</h3>
                    <div style={{ display: 'flex', gap: 15, fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
                            <span style={{ color: 'var(--color-text-2)' }}>Completed</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444' }} />
                            <span style={{ color: 'var(--color-text-2)' }}>Missed</span>
                        </div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={staffPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: 'var(--color-text-2)', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'var(--color-text-3)', fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={40} name="Completed" />
                        <Bar dataKey="missed" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} name="Missed" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
