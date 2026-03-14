import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { 
    Clock, User, Briefcase, Calendar as CalendarIcon, 
    Filter, Search, Mail, Phone, CheckCircle, XCircle, Bell, Loader2, Star, Users, X, Info
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function WaitlistPage() {
    const { user } = useSelector(s => s.auth);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ date: '', status: 'waiting' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEntry, setSelectedEntry] = useState(null); // For confirm modal
    const [confirmTime, setConfirmTime] = useState('10:00');
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchWaitlist = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams(filters).toString();
            const [waitlistRes, staffRes] = await Promise.all([
                api.get(`/waitlist/tenant?${query}`),
                api.get('/staff')
            ]);
            setEntries(waitlistRes.data.data);
            setStaffList(staffRes.data.data);
        } catch (err) {
            toast.error('Failed to fetch waitlist');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWaitlist();
    }, [filters]);

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this waitlist entry?')) return;
        try {
            await api.put(`/waitlist/${id}/cancel`);
            toast.success('Entry cancelled');
            fetchWaitlist();
        } catch (err) { 
            toast.error('Failed to cancel'); 
        }
    };

    const handleConfirm = async () => {
        if (!selectedEntry || !confirmTime) return;
        setActionLoading(true);
        try {
            const res = await api.put(`/waitlist/${selectedEntry._id}/confirm`, { 
                startTime: confirmTime,
                staffId: selectedStaff || null
            });
            toast.success(`Booking confirmed! Assigned to ${res.data.data.assignedStaff}`);
            setSelectedEntry(null);
            fetchWaitlist();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to confirm booking');
        } finally {
            setActionLoading(false);
        }
    };

    const handleNotify = (e) => {
        toast.success(`Broadcasting opening alert to ${e.customerId.name}... (Feature in progress)`);
    };

    const filteredEntries = entries.filter(e => 
        e.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.serviceId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusInfo = (status) => {
        switch (status) {
            case 'waiting': return { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', color: '#818cf8', label: 'Waiting' };
            case 'notified': return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', color: '#fbbf24', label: 'Notified' };
            case 'booked': return { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', color: '#34d399', label: 'Booked' };
            case 'expired': return { bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)', color: '#9ca3af', label: 'Expired' };
            default: return { bg: 'var(--color-surface)', border: 'rgba(255,255,255,0.1)', color: 'inherit', label: status };
        }
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ padding: 10, borderRadius: 12, background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary-light)' }}>
                            <Clock size={24} />
                        </div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Waitlist Management</h1>
                    </div>
                    <p style={{ color: 'var(--color-text-3)', fontSize: '1.05rem', margin: 0 }}>Efficiently track demand and fill empty slots instantly.</p>
                </div>
                
                <div style={{ display: 'flex', gap: 20 }}>
                    <div className="card" style={{ padding: '16px 24px', border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(145deg, rgba(255,255,255,0.03), transparent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={20} color="var(--color-primary-light)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Load</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{entries.filter(e => e.status === 'waiting' || e.status === 'notified').length} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-3)', fontWeight: 400 }}>Entries</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Filter Bar */}
            <div className="card mb-8" style={{ padding: '12px', display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                    <input 
                        type="text" 
                        placeholder="Filter by customer name, email or service..." 
                        style={{ 
                            width: '100%', padding: '14px 14px 14px 48px', 
                            background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: 12, color: '#fff' 
                        }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div style={{ height: 32, width: 1, background: 'rgba(255,255,255,0.1)' }}></div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                        <CalendarIcon size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                        <input 
                            type="date" 
                            style={{ 
                                padding: '10px 12px 10px 38px', borderRadius: 10, 
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)',
                                color: '#fff', fontSize: '0.9rem', width: 180
                            }}
                            value={filters.date}
                            onChange={e => setFilters({ ...filters, date: e.target.value })}
                        />
                    </div>
                    
                    <select 
                        style={{ 
                            padding: '10px 16px', borderRadius: 10, 
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)',
                            color: '#fff', fontSize: '0.9rem', cursor: 'pointer', outline: 'none'
                        }}
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="waiting">Live Waiting</option>
                        <option value="notified">Action Sent</option>
                        <option value="booked">Converted</option>
                        <option value="expired">Archived</option>
                        <option value="">Full History</option>
                    </select>
                </div>
            </div>

            {/* Table Area with Shadow and Blur */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(20,22,40,0.4)', backdropFilter: 'blur(20px)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Customer Information</th>
                            <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Requested Interest</th>
                            <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Target Date</th>
                            <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Engagement</th>
                            <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</th>
                            <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ padding: 100, textAlign: 'center' }}>
                                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--color-primary-light)', marginBottom: 20 }} />
                                        <div style={{ fontWeight: 600, letterSpacing: '0.05em', color: 'var(--color-text-3)' }}>SYNCHRONIZING WAITLIST...</div>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: 100, textAlign: 'center' }}>
                                    <div style={{ maxWidth: 300, margin: '0 auto' }}>
                                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                            <Search size={32} style={{ color: 'var(--color-text-3)' }} />
                                        </div>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: 8 }}>Empty Queue</h3>
                                        <p style={{ color: 'var(--color-text-3)', fontSize: '0.95rem' }}>No entries match your current search criteria.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredEntries.map((e) => {
                                const s = getStatusInfo(e.status);
                                return (
                                    <tr key={e._id} className="row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'all 0.3s' }}>
                                        <td style={{ padding: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <div style={{ position: 'relative' }}>
                                                    <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(45deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                                                        {e.customerId?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: s.color, border: '3px solid #1a1b2e' }}></div>
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{e.customerId?.name}</div>
                                                    <div style={{ display: 'flex', gap: 12 }}>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} /> {e.customerId?.email}</span>
                                                        {e.customerId?.phone && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {e.customerId?.phone}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px' }}>
                                            <div className="interest-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: e.serviceId?.color || '#6366f1' }}></div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{e.serviceId?.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>Provider: {e.staffId?.name || 'Any'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px' }}>
                                            <div className="date-card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                <div style={{ textAlign: 'center', minWidth: 44 }}>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-primary-light)', textTransform: 'uppercase' }}>{format(new Date(e.date), 'MMM')}</div>
                                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1 }}>{format(new Date(e.date), 'dd')}</div>
                                                </div>
                                                <div style={{ height: 24, width: 1, background: 'rgba(255,255,255,0.1)' }}></div>
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{format(new Date(e.date), 'EEEE')}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{format(new Date(e.date), 'yyyy')}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{format(new Date(e.createdAt), 'MMM d')}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{format(new Date(e.createdAt), 'h:mm a')}</div>
                                        </td>
                                        <td style={{ padding: '24px' }}>
                                            <div style={{ 
                                                display: 'inline-flex', padding: '6px 12px', borderRadius: 8, 
                                                fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                background: s.bg, color: s.color, border: `1px solid ${s.border}`
                                            }}>
                                                {s.label}
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px', textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: 6 }}>
                                                <button 
                                                    className="action-btn notify" 
                                                    disabled={e.status !== 'waiting'}
                                                    onClick={() => handleNotify(e)}
                                                    title="Send Direct Notification"
                                                >
                                                    <Bell size={18} />
                                                </button>
                                                <button 
                                                    className="action-btn confirm" 
                                                    disabled={e.status !== 'waiting' && e.status !== 'notified'}
                                                    onClick={() => setSelectedEntry(e)}
                                                    title="Assign Slot & Confirm"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button 
                                                    className="action-btn cancel" 
                                                    disabled={e.status === 'expired' || e.status === 'booked'}
                                                    onClick={() => handleCancel(e._id)}
                                                    title="Archive Entry"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Premium Confirm Modal */}
            {selectedEntry && (
                <div className="modal-overlay" style={{ 
                    position: 'fixed', inset: 0, background: 'rgba(8, 10, 24, 0.85)', 
                    backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
                }}>
                    <div className="card animate-scale" style={{ 
                        width: '100%', maxWidth: 440, padding: 40, borderRadius: 28,
                        background: 'linear-gradient(135deg, #1e1f35 0%, #111224 100%)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Confirm Placement</h2>
                                <p style={{ color: 'var(--color-text-3)', fontSize: '0.9rem', marginTop: 4 }}>System will handle staff scheduling automatically.</p>
                            </div>
                            <button onClick={() => setSelectedEntry(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: 8, borderRadius: 10, cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 20, marginBottom: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                    {selectedEntry.customerId?.name?.charAt(0)}
                                </div>
                                <div style={{ fontWeight: 600 }}>{selectedEntry.customerId?.name}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--color-text-3)' }}>Requested Date:</span>
                                <span style={{ fontWeight: 500 }}>{format(new Date(selectedEntry.date), 'EEEE, MMM d, yyyy')}</span>
                            </div>
                        </div>
                        
                        <div className="form-group mb-8">
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Pick Slot Start Time</label>
                            <div style={{ position: 'relative' }}>
                                <Clock size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
                                <input 
                                    type="time" 
                                    style={{ 
                                        width: '100%', height: 64, padding: '0 20px 0 52px', background: 'rgba(0,0,0,0.3)', 
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, color: '#fff', fontSize: '1.5rem', fontWeight: 700,
                                        outline: 'none', appearance: 'none'
                                    }}
                                    value={confirmTime}
                                    onChange={e => setConfirmTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group mb-8">
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Assign Provider (Optional)</label>
                            <select 
                                style={{ 
                                    width: '100%', height: 56, padding: '0 16px', background: 'rgba(0,0,0,0.3)', 
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: '#fff', fontSize: '1rem',
                                    outline: 'none', appearance: 'none'
                                }}
                                value={selectedStaff}
                                onChange={e => setSelectedStaff(e.target.value)}
                            >
                                <option value="">Auto-Allocate (Least Busy)</option>
                                {staffList.map(s => (
                                    <option key={s._id} value={s._id}>{s.name} ({s.role?.displayName || 'Staff'})</option>
                                ))}
                            </select>
                            <div style={{ marginTop: 16, display: 'flex', gap: 10, padding: 12, borderRadius: 10, background: 'rgba(99, 102, 241, 0.05)', color: '#818cf8', fontSize: '0.8rem' }}>
                                <Info size={16} style={{ flexShrink: 0 }} />
                                <span>The system checks availability and falls back to workload-balancing assignment automatically.</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 14 }}>
                            <button 
                                className="btn" 
                                style={{ flex: 1, padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700 }}
                                onClick={() => setSelectedEntry(null)}
                            >
                                Dismiss
                            </button>
                            <button 
                                className="btn" 
                                style={{ 
                                    flex: 2, padding: '16px', borderRadius: 14, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                                    border: 'none', color: '#fff', fontWeight: 800, boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)' 
                                }}
                                onClick={handleConfirm} 
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'ALLOCATING...' : 'CONFIRM APPOINTMENT'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .row-hover:hover {
                    background: rgba(255, 255, 255, 0.04) !important;
                    transform: translateX(4px);
                }
                .action-btn {
                    padding: 10px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.05);
                    background: rgba(255,255,255,0.03);
                    color: var(--color-text-3);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .action-btn:hover:not(:disabled) {
                    background: rgba(255,255,255,0.08);
                    transform: translateY(-2px);
                }
                .action-btn.notify:hover:not(:disabled) { color: #818cf8; border-color: rgba(99,102,241,0.3); }
                .action-btn.confirm:hover:not(:disabled) { color: #34d399; border-color: rgba(52,211,153,0.3); }
                .action-btn.cancel:hover:not(:disabled) { color: #ef4444; border-color: rgba(239,68,68,0.3); }
                .action-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                
                input[type="date"]::-webkit-calendar-picker-indicator,
                input[type="time"]::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    opacity: 0.5;
                }
            `}</style>
        </div>
    );
}
