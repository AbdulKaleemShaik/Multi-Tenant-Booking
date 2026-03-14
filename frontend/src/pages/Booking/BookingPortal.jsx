import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../services/api';
import { setSelectedService, setSelectedStaff, setSelectedDate, setSelectedSlot, setCurrentBooking, resetBookingFlow } from '../../store/bookingSlice';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';
import { Clock, ChevronRight, Check, Zap, Calendar, User, Briefcase } from 'lucide-react';

const STEPS = ['Service', 'Staff & Date', 'Slot', 'Confirm'];

export default function BookingPortal() {
    const { tenantSlug } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector(s => s.auth);
    const { selectedService, selectedStaff, selectedDate, selectedSlot } = useSelector(s => s.booking);

    const [step, setStep] = useState(0);
    const [tenant, setTenant] = useState(null);
    const [services, setServices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');

    // Generate next 14 days
    const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));

    useEffect(() => {
        dispatch(resetBookingFlow());
        const load = async () => {
            try {
                const [tenantRes, servicesRes, staffRes] = await Promise.all([
                    api.get(`/tenants/public/${tenantSlug}`),
                    api.get(`/services?tenantId=${tenantSlug}`),
                    api.get(`/staff`).catch(() => ({ data: { data: [] } })),
                ]);
                setTenant(tenantRes.data.data);
                // Fetch services using tenantId from tenant response
                const tid = tenantRes.data.data._id;
                const svc = await api.get(`/services?tenantId=${tid}`);
                setServices(svc.data.data || []);
                // For public booking, fetch staff via tenantId in query
                const stf = await api.get(`/schedules?tenantId=${tid}`);
                // Get unique staff from schedules
                const staffIds = [...new Set(stf.data.data.map(s => s.staffId?._id || s.staffId))];
                const staffData = stf.data.data.map(s => s.staffId).filter((s, i, a) => s && a.findIndex(x => (x?._id || x) === (s?._id || s)) === i);
                setStaff(staffData.filter(Boolean));
            } catch (err) { toast.error('Failed to load booking portal'); }
        };
        load();
    }, [tenantSlug]);

    useEffect(() => {
        if (selectedStaff && selectedDate && tenant) {
            setLoadingSlots(true);
            setSlots([]);
            dispatch(setSelectedSlot(null));
            api.get(`/schedules/available-slots?staffId=${selectedStaff._id}&date=${selectedDate}&tenantId=${tenant._id}`)
                .then(r => setSlots(r.data.data?.slots || []))
                .catch(() => setSlots([]))
                .finally(() => setLoadingSlots(false));
        }
    }, [selectedStaff, selectedDate, tenant]);

    const handleBook = async () => {
        if (!isAuthenticated) {
            toast('Please create an account first to book', { icon: '🔐' });
            navigate(`/register?tenant=${tenantSlug}`);
            return;
        }
        setSubmitting(true);
        try {
            const { data } = await api.post('/bookings', {
                serviceId: selectedService._id,
                staffId: selectedStaff._id,
                bookingDate: selectedDate,
                startTime: selectedSlot,
                tenantId: tenant._id,
                notes,
            });
            dispatch(setCurrentBooking(data.data));
            toast.success('Booking created! 🎉');
            navigate(`/book/${tenantSlug}/confirm`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Booking failed');
        } finally { setSubmitting(false); }
    };

    if (!tenant) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
                <p>Loading booking portal...</p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.1) 0%, var(--color-bg) 60%)', padding: '40px 20px' }}>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, opacity: 0.7, textDecoration: 'none', color: 'var(--color-text-2)', fontSize: '0.85rem' }}>
                        <Zap size={14} /> Powered by BookFlow
                    </Link>
                    <h2 style={{ fontSize: '1.8rem' }}>{tenant.name}</h2>
                    {tenant.description && <p style={{ color: 'var(--color-text-2)', marginTop: 6 }}>{tenant.description}</p>}
                </div>

                {/* Step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
                    {STEPS.map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 'var(--radius-full)', background: i === step ? 'var(--gradient-primary)' : i < step ? 'rgba(16,185,129,0.15)' : 'var(--color-surface)', color: i === step ? 'white' : i < step ? '#10b981' : 'var(--color-text-3)', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.3s' }}>
                                {i < step ? <Check size={13} /> : null}{s}
                            </div>
                            {i < STEPS.length - 1 && <ChevronRight size={14} color="var(--color-text-3)" />}
                        </div>
                    ))}
                </div>

                {/* Step 0: Choose Service */}
                {step === 0 && (
                    <div className="animate-slide-up">
                        <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Briefcase size={18} color="var(--color-primary-light)" /> Choose a Service</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                            {services.map(s => (
                                <div key={s._id} onClick={() => { dispatch(setSelectedService(s)); setStep(1); }} className="card" style={{ cursor: 'pointer', borderColor: selectedService?._id === s._id ? 'var(--color-primary)' : 'var(--color-border-light)', borderTop: `3px solid ${s.color || 'var(--color-primary)'}`, transition: 'all 0.2s' }}>
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{s.name}</div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                        <span className="badge badge-gray"><Clock size={11} /> {s.duration} min</span>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary-light)' }}>₹{s.price}</div>
                                    {s.description && <p style={{ fontSize: '0.8rem', marginTop: 6 }}>{s.description}</p>}
                                </div>
                            ))}
                        </div>
                        {services.length === 0 && <div className="card" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-3)' }}>No services available yet.</div>}
                    </div>
                )}

                {/* Step 1: Choose Staff & Date */}
                {step === 1 && (
                    <div className="animate-slide-up">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <div>
                                <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} color="var(--color-primary-light)" /> Choose Staff</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {staff.map(m => (
                                        <div key={m._id} onClick={() => dispatch(setSelectedStaff(m))} className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderColor: selectedStaff?._id === m._id ? 'var(--color-primary)' : 'var(--color-border-light)', padding: 14 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white' }}>{m.name?.charAt(0)}</div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{m.name}</div>
                                                {selectedStaff?._id === m._id && <Check size={14} color="var(--color-success)" />}
                                            </div>
                                        </div>
                                    ))}
                                    {staff.length === 0 && <p style={{ color: 'var(--color-text-3)' }}>No staff available.</p>}
                                </div>
                            </div>
                            <div>
                                <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={18} color="var(--color-primary-light)" /> Choose Date</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                    {days.map(d => {
                                        const val = format(d, 'yyyy-MM-dd');
                                        const isSelected = selectedDate === val;
                                        return (
                                            <div key={val} onClick={() => dispatch(setSelectedDate(val))} className="card" style={{ cursor: 'pointer', padding: '10px 14px', textAlign: 'center', borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border-light)', background: isSelected ? 'rgba(99,102,241,0.15)' : 'var(--color-surface)', transition: 'all 0.2s' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)', textTransform: 'uppercase' }}>{format(d, 'EEE')}</div>
                                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{format(d, 'd')}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-2)' }}>{format(d, 'MMM')}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(0)}>← Back</button>
                            <button className="btn btn-primary" style={{ flex: 2 }} disabled={!selectedStaff || !selectedDate} onClick={() => setStep(2)}>Choose Time Slot →</button>
                        </div>
                    </div>
                )}

                {/* Step 2: Choose Slot */}
                {step === 2 && (
                    <div className="animate-slide-up">
                        <h3 style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={18} color="var(--color-primary-light)" /> Available Slots</h3>
                        <p style={{ color: 'var(--color-text-2)', marginBottom: 20, fontSize: '0.9rem' }}>{format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')} · {selectedStaff?.name}</p>
                        {loadingSlots ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                                {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 10 }} />)}
                            </div>
                        ) : slots.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '40px 0' }}>
                                <Clock size={40} style={{ color: 'var(--color-text-3)', marginBottom: 12 }} />
                                <p>No available slots for this day. Try another date.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                                {slots.map(slot => (
                                    <div key={slot} onClick={() => dispatch(setSelectedSlot(slot))} style={{ padding: '12px 8px', textAlign: 'center', borderRadius: 'var(--radius-md)', border: `1px solid ${selectedSlot === slot ? 'var(--color-primary)' : 'var(--color-border-light)'}`, background: selectedSlot === slot ? 'rgba(99,102,241,0.2)' : 'var(--color-surface)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', color: selectedSlot === slot ? 'var(--color-primary-light)' : 'var(--color-text)' }}>
                                        {slot}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-3 mt-6">
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
                            <button className="btn btn-primary" style={{ flex: 2 }} disabled={!selectedSlot} onClick={() => setStep(3)}>Review & Confirm →</button>
                        </div>
                    </div>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <div className="animate-slide-up">
                        <h3 style={{ marginBottom: 20 }}>Review Your Booking</h3>
                        <div className="card" style={{ background: 'var(--gradient-surface)', border: '1px solid var(--color-border)', marginBottom: 20 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {[
                                    { label: 'Service', value: selectedService?.name, sub: `${selectedService?.duration} min · ₹${selectedService?.price}` },
                                    { label: 'Staff', value: selectedStaff?.name },
                                    { label: 'Date', value: format(new Date(selectedDate), 'EEEE, MMMM d, yyyy') },
                                    { label: 'Time', value: selectedSlot },
                                ].map(({ label, value, sub }) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                                        <span style={{ color: 'var(--color-text-2)', fontSize: '0.9rem' }}>{label}</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 600 }}>{value}</div>
                                            {sub && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-2)' }}>{sub}</div>}
                                        </div>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
                                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total</span>
                                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary-light)' }}>₹{selectedService?.price}</span>
                                </div>
                            </div>
                        </div>
                        <div className="form-group mb-4">
                            <label className="form-label">Notes (optional)</label>
                            <textarea className="form-textarea" placeholder="Any special requests or notes..." value={notes} onChange={e => setNotes(e.target.value)} style={{ minHeight: 80 }} />
                        </div>
                        <div className="flex gap-3">
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>← Back</button>
                            <button className="btn btn-primary btn-lg" style={{ flex: 2 }} disabled={submitting} onClick={handleBook}>
                                {submitting ? 'Booking...' : isAuthenticated ? '✓ Confirm Booking' : '🔐 Login to Book'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
