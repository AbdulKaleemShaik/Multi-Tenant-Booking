import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Clock, Search, Filter } from 'lucide-react';

const STATUS_CONFIG = {
    pending: { label: 'Pending', cls: 'badge-warning', dot: 'pending' },
    confirmed: { label: 'Confirmed', cls: 'badge-success', dot: 'confirmed' },
    completed: { label: 'Completed', cls: 'badge-info', dot: 'completed' },
    cancelled: { label: 'Cancelled', cls: 'badge-danger', dot: 'cancelled' },
    no_show: { label: 'No Show', cls: 'badge-gray', dot: 'cancelled' },
};

export default function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selected, setSelected] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const load = async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);
            const { data } = await api.get(`/bookings?${params}`);
            setBookings(data.data || []);
        } catch (_) { }
        setLoading(false);
    };

    useEffect(() => { load(); }, [statusFilter]);

    const updateStatus = async (id, status) => {
        setUpdatingId(id);
        try {
            await api.put(`/bookings/${id}/status`, { status });
            toast.success(`Booking ${status}`);
            load();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setUpdatingId(null); setSelected(null); }
    };

    const filtered = bookings.filter((b) =>
        !filter || b.customerId?.name?.toLowerCase().includes(filter.toLowerCase()) ||
        b.serviceId?.name?.toLowerCase().includes(filter.toLowerCase()) ||
        b.bookingRef?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="animate-fade">
            <div className="page-header">
                <h2>Bookings</h2>
                <p>Manage and track all customer appointments</p>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                    <input className="form-input" style={{ paddingLeft: 38 }} placeholder="Search customer, service or ref..." value={filter} onChange={(e) => setFilter(e.target.value)} />
                </div>
                <div style={{ position: 'relative' }}>
                    <Filter size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                    <select className="form-select" style={{ paddingLeft: 38, width: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Status</option>
                        {Object.entries(STATUS_CONFIG).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
                    </select>
                </div>
            </div>

            {loading ? <div className="skeleton" style={{ height: 400, borderRadius: 16 }} /> : (
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>Ref</th><th>Customer</th><th>Service</th><th>Staff</th><th>Date & Time</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-3)' }}>No bookings found</td></tr>
                            ) : filtered.map((b) => {
                                const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                                return (
                                    <tr key={b._id}>
                                        <td><code style={{ fontSize: '0.75rem', background: 'var(--color-surface-2)', padding: '2px 6px', borderRadius: 4 }}>{b.bookingRef}</code></td>
                                        <td><div style={{ fontWeight: 600 }}>{b.customerId?.name}</div><div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>{b.customerId?.email}</div></td>
                                        <td>{b.serviceId?.name}<div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>{b.serviceId?.duration} min</div></td>
                                        <td>{b.staffId?.name}</td>
                                        <td><div style={{ fontWeight: 500 }}>{b.bookingDate ? format(new Date(b.bookingDate), 'dd MMM yyyy') : '-'}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {b.startTime} – {b.endTime}</div>
                                        </td>
                                        <td style={{ fontWeight: 700 }}>₹{b.totalAmount?.toLocaleString()}</td>
                                        <td><span className={`badge ${sc.cls}`}><span className={`status-dot ${sc.dot}`} />{sc.label}</span></td>
                                        <td>
                                            {b.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'none' }} disabled={updatingId === b._id} onClick={() => updateStatus(b._id, 'confirmed')}>Confirm</button>
                                                    <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none' }} disabled={updatingId === b._id} onClick={() => updateStatus(b._id, 'cancelled')}>Cancel</button>
                                                </div>
                                            )}
                                            {b.status === 'confirmed' && (
                                                <button className="btn btn-sm" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'none' }} disabled={updatingId === b._id} onClick={() => updateStatus(b._id, 'completed')}>Mark Done</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
