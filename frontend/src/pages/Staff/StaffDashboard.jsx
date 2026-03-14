import { useEffect, useState } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { Clock, CheckCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
    pending: { label: 'Pending', cls: 'badge-warning' },
    confirmed: { label: 'Confirmed', cls: 'badge-success' },
    completed: { label: 'Completed', cls: 'badge-info' },
    cancelled: { label: 'Cancelled', cls: 'badge-danger' },
};

export default function StaffDashboard() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try { const { data } = await api.get('/bookings'); setBookings(data.data || []); }
        catch (_) { } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const markDone = async (id) => {
        try { await api.put(`/bookings/${id}/status`, { status: 'completed' }); toast.success('Marked as completed'); load(); }
        catch (_) { toast.error('Failed'); }
    };

    const today = bookings.filter(b => {
        const d = new Date(b.bookingDate);
        const now = new Date();
        return d.toDateString() === now.toDateString();
    });
    const upcoming = bookings.filter(b => new Date(b.bookingDate) > new Date() && b.status !== 'cancelled');

    return (
        <div className="animate-fade">
            <div className="page-header flex justify-between items-center">
                <div><h2>My Bookings</h2><p>Your scheduled appointments for today and upcoming</p></div>
                <div className="flex gap-3">
                    <div className="stat-card" style={{ padding: '12px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>{today.length}</div>
                        <div className="text-xs text-muted">Today</div>
                    </div>
                    <div className="stat-card" style={{ padding: '12px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>{upcoming.length}</div>
                        <div className="text-xs text-muted">Upcoming</div>
                    </div>
                </div>
            </div>

            {/* Today */}
            <div className="mb-6">
                <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={20} color="var(--color-primary-light)" /> Today's Appointments</h3>
                {loading ? <div className="skeleton" style={{ height: 200, borderRadius: 16 }} /> : today.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--color-text-2)' }}>No appointments today. Enjoy your day! ☀️</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {today.sort((a, b) => a.startTime > b.startTime ? 1 : -1).map(b => {
                            const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                            return (
                                <div key={b._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, borderLeft: `4px solid ${b.status === 'confirmed' ? 'var(--color-success)' : 'var(--color-warning)'}` }}>
                                    <div style={{ textAlign: 'center', minWidth: 60 }}>
                                        <div style={{ fontWeight: 800, color: 'var(--color-primary-light)', fontSize: '1rem' }}>{b.startTime}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{b.endTime}</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600 }}>{b.customerId?.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={12} />{b.serviceId?.name} · {b.serviceId?.duration} min</div>
                                    </div>
                                    <span className={`badge ${sc.cls}`}>{sc.label}</span>
                                    {b.status === 'confirmed' && (
                                        <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'none' }} onClick={() => markDone(b._id)}>
                                            <CheckCircle size={14} /> Done
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Upcoming */}
            <div>
                <h3 style={{ marginBottom: 16 }}>Upcoming Appointments</h3>
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>Customer</th><th>Service</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
                        <tbody>
                            {upcoming.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-3)' }}>No upcoming appointments</td></tr> :
                                upcoming.slice(0, 15).map(b => {
                                    const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                                    return (
                                        <tr key={b._id}>
                                            <td><div style={{ fontWeight: 600 }}>{b.customerId?.name}</div></td>
                                            <td>{b.serviceId?.name}</td>
                                            <td>{format(new Date(b.bookingDate), 'dd MMM yyyy')}</td>
                                            <td style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{b.startTime}</td>
                                            <td><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
