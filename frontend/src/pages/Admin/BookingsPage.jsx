import { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Clock, Search, Filter, X } from 'lucide-react';

const STATUS_CONFIG = {
    pending: { label: 'Pending', cls: 'badge-warning', dot: 'pending' },
    confirmed: { label: 'Confirmed', cls: 'badge-success', dot: 'confirmed' },
    completed: { label: 'Completed', cls: 'badge-info', dot: 'completed' },
    cancelled: { label: 'Cancelled', cls: 'badge-danger', dot: 'cancelled' },
    no_show: { label: 'No Show', cls: 'badge-gray', dot: 'cancelled' },
};

const SearchableDropdown = ({ label, options, value, onChange, placeholder = 'Search...' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);
    const selected = options.find(o => o.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = options.filter(o => 
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="input-group" style={{ position: 'relative' }} ref={dropdownRef}>
            <label style={{ color: 'var(--color-text-2)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>{label}</label>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', 
                    color: selected ? '#fff' : 'var(--color-text-3)', padding: '12px 14px', 
                    borderRadius: 12, width: '100%', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.2s'
                }}
            >
                <span>{selected ? selected.label : placeholder}</span>
                <Clock size={14} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </div>

            {isOpen && (
                <div style={{ 
                    position: 'absolute', top: '100%', left: 0, right: 0, 
                    background: '#1a1b2e', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, marginTop: 8, zIndex: 1100, overflow: 'hidden',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    animation: 'fade-in 0.2s ease'
                }}>
                    <div style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <input 
                            autoFocus
                            placeholder="Type to filter..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                                width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none',
                                color: '#fff', fontSize: '0.85rem', padding: '8px 12px', borderRadius: 8
                            }}
                        />
                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--color-text-3)', textAlign: 'center' }}>No results</div>
                        ) : filtered.map(o => (
                            <div 
                                key={o.value}
                                onClick={(e) => { e.stopPropagation(); onChange(o.value); setIsOpen(false); setSearch(''); }}
                                style={{ 
                                    padding: '10px 14px', cursor: 'pointer', fontSize: '0.9rem',
                                    background: value === o.value ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                    color: value === o.value ? '#818cf8' : '#fff',
                                    transition: '0.1s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.target.style.background = value === o.value ? 'rgba(99, 102, 241, 0.2)' : 'transparent'}
                            >
                                {o.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState([]);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filter, setFilter] = useState(''); // Text search
    
    // Default range is last 7 days as requested
    const [filters, setFilters] = useState({
        startDate: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        status: '',
        staffId: ''
    });

    const [tempFilters, setTempFilters] = useState(filters);
    const [updatingId, setUpdatingId] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.status) params.set('status', filters.status);
            if (filters.startDate) params.set('from', filters.startDate);
            if (filters.endDate) params.set('to', filters.endDate);
            if (filters.staffId) params.set('staffId', filters.staffId);
            
            const { data } = await api.get(`/bookings?${params}`);
            setBookings(data.data || []);
        } catch (_) { }
        setLoading(false);
    };

    useEffect(() => {
        api.get('/staff').then(r => setStaffList(r.data.data)).catch(() => { });
    }, []);

    useEffect(() => { load(); }, [filters]);

    const handleRefresh = () => load();

    const applyFilters = () => {
        setFilters(tempFilters);
        setShowFilterModal(false);
    };

    const resetFilters = () => {
        const initial = {
            startDate: format(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            endDate: format(new Date(), 'yyyy-MM-dd'),
            status: '',
            staffId: ''
        };
        setTempFilters(initial);
        setFilters(initial);
        setShowFilterModal(false);
    };

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
            <div className="flex gap-3 mb-6" style={{ alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                    <input className="form-input" style={{ paddingLeft: 38 }} placeholder="Search customer, service or ref..." value={filter} onChange={(e) => setFilter(e.target.value)} />
                </div>
                
                <button className="btn btn-outline" onClick={() => { setTempFilters(filters); setShowFilterModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Filter size={18} /> Filters
                </button>
                
                <button className="btn btn-primary" onClick={handleRefresh}>Refresh</button>
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="modal-overlay" style={{ 
                    position: 'fixed', inset: 0, 
                    background: 'rgba(8, 10, 24, 0.85)', 
                    backdropFilter: 'blur(12px)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    zIndex: 1000,
                    animation: 'fade-in 0.3s ease'
                }}>
                    <div className="modal-content card animate-scale" style={{ 
                        width: '100%', maxWidth: 480, padding: 32, 
                        background: 'linear-gradient(135deg, var(--color-surface) 0%, #1a1b2e 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        borderRadius: 24
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>Refine Bookings</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-3)', marginTop: 4 }}>Customize your view with precision</p>
                            </div>
                            <button onClick={() => setShowFilterModal(false)} style={{ 
                                background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', 
                                width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="grid-2 gap-4">
                                <div className="input-group">
                                    <label style={{ color: 'var(--color-text-2)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>Date From</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="date" 
                                            className="input" 
                                            value={tempFilters.startDate} 
                                            onChange={(e) => setTempFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px 14px', borderRadius: 12, width: '100%' }}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label style={{ color: 'var(--color-text-2)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>Date To</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="date" 
                                            className="input" 
                                            value={tempFilters.endDate} 
                                            onChange={(e) => setTempFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px 14px', borderRadius: 12, width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <SearchableDropdown 
                                label="Staff Member"
                                options={[{ value: '', label: 'All Personnel' }, ...staffList.map(s => ({ value: s._id, label: s.name }))]}
                                value={tempFilters.staffId}
                                onChange={(val) => setTempFilters(prev => ({ ...prev, staffId: val }))}
                                placeholder="Choose Staff"
                            />

                            <SearchableDropdown 
                                label="Status Category"
                                options={[{ value: '', label: 'Full Spectrum' }, ...Object.entries(STATUS_CONFIG).map(([val, { label }]) => ({ value: val, label }))]}
                                value={tempFilters.status}
                                onChange={(val) => setTempFilters(prev => ({ ...prev, status: val }))}
                                placeholder="Select Status"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 14, marginTop: 40 }}>
                            <button className="btn" onClick={resetFilters} style={{ 
                                flex: 1, padding: '14px', borderRadius: 14, 
                                background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                                fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                            }}>Reset Defaults</button>
                            <button className="btn" onClick={applyFilters} style={{ 
                                flex: 1.5, padding: '14px', borderRadius: 14, 
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none',
                                fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}>Apply Filters</button>
                        </div>
                    </div>
                </div>
            )}

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
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{b.customerId?.name}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>{b.customerId?.email}</div>
                                            {b.recurrence?.isRecurring && (
                                                <div style={{ marginTop: 4 }}>
                                                    <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                                        <Clock size={10} style={{ marginRight: 3 }} /> {b.recurrence.frequency} ({b.recurrence.count})
                                                    </span>
                                                </div>
                                            )}
                                        </td>
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
