import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../services/api';
import { setSelectedService, setSelectedStaff, setSelectedDate, setSelectedSlot, setCurrentBooking, resetBookingFlow } from '../../store/bookingSlice';
import toast from 'react-hot-toast';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, isBefore, startOfDay } from 'date-fns';
import { Clock, ChevronRight, Check, Zap, Calendar, User, Briefcase, Star, ChevronLeft, Info, ShoppingBag, ShieldCheck, X, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';

const shortcutString = (str, len) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
};

export default function BookingPortal() {
    const { tenantSlug } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector(s => s.auth);
    const { selectedService, selectedStaff, selectedDate, selectedSlot } = useSelector(s => s.booking);

    const [tenant, setTenant] = useState(null);
    const [services, setServices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [discountInfo, setDiscountInfo] = useState(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({ averageRating: 0, count: 0 });
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [intakeResponses, setIntakeResponses] = useState({});
    const [recurrence, setRecurrence] = useState({ isRecurring: false, frequency: 'weekly', count: 2 });
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const configRef = useRef(null);

    useEffect(() => {
        dispatch(resetBookingFlow());
        const load = async () => {
            try {
                const tenantRes = await api.get(`/tenants/public/${tenantSlug}`);
                const tenantData = tenantRes.data.data;
                setTenant(tenantData);

                const tid = tenantData._id;

                const [svcRes, stfRes, revRes] = await Promise.all([
                    api.get(`/services?tenantId=${tid}`),
                    api.get(`/schedules?tenantId=${tid}`),
                    api.get(`/reviews/tenant/${tid}`)
                ]);

                setServices(svcRes.data.data || []);
                const revData = revRes.data.data;
                setReviews(revData.reviews || []);
                setReviewStats(revData.stats || { averageRating: 0, count: 0 });

                const staffData = stfRes.data.data
                    .map(s => s.staffId)
                    .filter((s, i, a) => s && a.findIndex(x => (x?._id || x) === (s?._id || s)) === i);
                setStaff(staffData.filter(Boolean));

            } catch (err) {
                console.error('Portal Load Error:', err);
                toast.error('Failed to load booking portal');
            }
        };
        load();
    }, [tenantSlug, dispatch]);

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
    }, [selectedStaff, selectedDate, tenant, dispatch]);

    const totalAmount = (selectedService?.price || 0) + selectedAddons.reduce((acc, a) => acc + a.price, 0);
    const finalAmount = discountInfo ? Math.max(0, totalAmount - (discountInfo.type === 'percentage' ? (totalAmount * discountInfo.value / 100) : discountInfo.value)) : totalAmount;

    const handleBook = async () => {
        if (!isAuthenticated) return toast.error('Please login to complete your booking');
        if (!selectedSlot) return toast.error('Please select a time slot');
        
        const missing = (selectedService.intakeFields || []).find(f => f.required && !intakeResponses[f.label]);
        if (missing) return toast.error(`Please fill in: ${missing.label}`);

        setSubmitting(true);
        try {
            const res = await api.post('/bookings', {
                serviceId: selectedService._id,
                staffId: selectedStaff._id,
                bookingDate: selectedDate,
                startTime: selectedSlot,
                tenantId: tenant._id,
                notes: notes || specialInstructions,
                couponCode: discountInfo ? discountInfo.code : undefined,
                selectedAddons: selectedAddons.map(a => a.name),
                intakeResponses: [
                    ...Object.entries(intakeResponses).map(([label, value]) => ({ label, value })),
                    ...(specialInstructions ? [{ label: 'Special Instructions', value: specialInstructions }] : [])
                ],
                recurrence: recurrence.isRecurring ? recurrence : undefined
            });
            dispatch(setCurrentBooking(res.data.data));
            toast.success('Your appointment has been booked!');
            navigate(`/book/${tenantSlug}/confirm`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Booking failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setValidatingCoupon(true);
        try {
            const res = await api.post('/coupons/validate', {
                code: couponCode,
                tenantId: tenant._id,
                bookingAmount: totalAmount
            });
            setDiscountInfo(res.data.data);
            toast.success('Coupon applied successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid coupon');
            setDiscountInfo(null);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleJoinWaitlist = async () => {
        if (!isAuthenticated) return toast.error('Please login to join the waitlist');
        setSubmitting(true);
        try {
            await api.post('/waitlist/join', {
                serviceId: selectedService._id,
                staffId: selectedStaff._id,
                date: selectedDate,
                tenantId: tenant._id
            });
            toast.success('Successfully joined the waitlist! We will notify you of openings.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to join waitlist');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (tenant?.primaryColor) {
            document.documentElement.style.setProperty('--color-primary', tenant.primaryColor);
        }
    }, [tenant]);

    if (!tenant) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="animate-spin" style={{ width: 44, height: 44, border: '3px solid rgba(99,102,241,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', margin: '0 auto 20px' }} />
                <p style={{ letterSpacing: '0.05em', color: 'var(--color-text-2)' }}>PREPARING PORTAL</p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, var(--color-bg) 75%)', color: 'var(--color-text)' }}>
            
            {/* Nav / Header Bar */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10, 10, 15, 0.7)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(99,102,241,0.2)' }}>
                            <Zap size={18} color="white" />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1rem', letterSpacing: '-0.01em' }}>{tenant.name}</h4>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Premium Portal</span>
                        </div>
                    </div>
                    {reviewStats.count > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                           <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{reviewStats.averageRating.toFixed(1)} / 5.0</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)' }}>{reviewStats.count} Reviews</div>
                           </div>
                           <div style={{ display: 'flex', gap: 1 }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} size={12} fill={s <= Math.round(reviewStats.averageRating) ? 'var(--color-warning)' : 'none'} color={s <= Math.round(reviewStats.averageRating) ? 'var(--color-warning)' : 'rgba(255,255,255,0.1)'} />
                                ))}
                           </div>
                        </div>
                    )}
                </div>
            </div>

            <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px 100px' }}>
                <div className="grid-2-1" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 48, alignItems: 'start' }}>
                    
                    {/* Left Column: Selection Journey */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
                        
                        {/* Step 1: Services */}
                        <section className="animate-slide-up">
                            <div style={{ marginBottom: 32 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <span style={{ background: 'var(--gradient-primary)', color: 'white', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, boxShadow: '0 4px 10px rgba(99,102,241,0.3)' }}>1</span>
                                    <h2 style={{ fontSize: '1.6rem', margin: 0, letterSpacing: '-0.03em' }}>Select Your Service</h2>
                                </div>
                                <p style={{ color: 'var(--color-text-3)', fontSize: '0.95rem', marginLeft: 40 }}>Luxury treatments tailored to your unique requirements.</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                                {services.map(s => {
                                    const isSelected = selectedService?._id === s._id;
                                    return (
                                        <div 
                                            key={s._id}
                                            onClick={() => {
                                                dispatch(setSelectedService(s));
                                                setTimeout(() => configRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                                            }}
                                            className={`card-premium hover-lift ${isSelected ? 'selected' : ''}`}
                                            style={{ 
                                                cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', 
                                                borderRadius: 24, padding: 32, overflow: 'hidden', position: 'relative',
                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                background: isSelected ? 'rgba(99,102,241,0.05)' : 'var(--color-surface)'
                                            }}
                                        >
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: s.color || 'var(--color-primary)', opacity: isSelected ? 1 : 0.2 }}></div>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-2)' }}>
                                                    <Briefcase size={20} />
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: isSelected ? 'var(--color-primary-light)' : 'inherit' }}>₹{s.price}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)', fontWeight: 700 }}>STARTING</div>
                                                </div>
                                            </div>

                                            <h3 style={{ fontSize: '1.2rem', marginBottom: 12, fontWeight: 700 }}>{s.name}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-2)', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: 8 }}>
                                                    <Clock size={12} className="text-primary" /> {s.duration} mins
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', fontWeight: 500 }}>Expert Care</div>
                                            </div>
                                            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--color-text-2)' }}>{shortcutString(s.description, 120)}</p>
                                            
                                            {isSelected && (
                                                <div className="animate-fade-in" style={{ position: 'absolute', bottom: 20, right: 24, color: 'var(--color-primary-light)' }}>
                                                    <Check size={20} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {selectedService && (
                            <div ref={configRef} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
                                
                                {/* Step 2: Customization */}
                                {(selectedService.addons?.length > 0 || selectedService.intakeFields?.length > 0) && (
                                    <section className="animate-slide-up">
                                        <div style={{ marginBottom: 32 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                                <span style={{ background: 'var(--gradient-primary)', color: 'white', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>2</span>
                                                <h2 style={{ fontSize: '1.6rem', margin: 0, letterSpacing: '-0.03em' }}>Personalize Your Visit</h2>
                                            </div>
                                            <p style={{ color: 'var(--color-text-3)', fontSize: '0.95rem', marginLeft: 40 }}>Enhance your treatment with premium extras and details.</p>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) 1fr', gap: 40 }}>
                                            {selectedService.addons?.length > 0 && (
                                                <div>
                                                    <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', marginBottom: 20, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                                                        <Sparkles size={16} className="text-primary" /> AVAILABLE ADD-ONS
                                                    </h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                        {selectedService.addons.map(a => {
                                                            const isSelected = selectedAddons.some(x => x.name === a.name);
                                                            return (
                                                                <div 
                                                                    key={a.name}
                                                                    onClick={() => {
                                                                        if (isSelected) setSelectedAddons(selectedAddons.filter(x => x.name !== a.name));
                                                                        else setSelectedAddons([...selectedAddons, a]);
                                                                    }}
                                                                    className={`card-premium hover-lift ${isSelected ? 'selected' : ''}`}
                                                                    style={{ 
                                                                        cursor: 'pointer', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 20,
                                                                        border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.03)',
                                                                        background: isSelected ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.01)'
                                                                    }}
                                                                >
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                                        <div style={{ width: 20, height: 20, borderRadius: 6, border: '2px solid var(--color-primary)', background: isSelected ? 'var(--color-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                                                            {isSelected && <Check size={12} color="white" strokeWidth={4} />}
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.name}</div>
                                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>+{a.duration} mins</div>
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary-light)' }}>+₹{a.price}</div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', marginBottom: 20, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                                                    <MessageSquare size={16} className="text-primary" /> REQUIREMENTS
                                                </h4>
                                                <div className="card-glass" style={{ padding: '24px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    {(selectedService.intakeFields || []).length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                                            {selectedService.intakeFields.map((field, idx) => (
                                                                <div key={idx} className="form-group">
                                                                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{field.label} {field.required && <span className="text-danger">*</span>}</label>
                                                                    {field.type === 'select' ? (
                                                                        <select className="form-input" style={{ height: 44, borderRadius: 12, background: 'rgba(0,0,0,0.2)' }} value={intakeResponses[field.label] || ''} onChange={e => setIntakeResponses({ ...intakeResponses, [field.label]: e.target.value })} required={field.required}>
                                                                            <option value="">Select option...</option>
                                                                            {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                                                                        </select>
                                                                    ) : field.type === 'textarea' ? (
                                                                        <textarea className="form-input" style={{ minHeight: 100, borderRadius: 12, padding: 14, background: 'rgba(0,0,0,0.2)' }} value={intakeResponses[field.label] || ''} onChange={e => setIntakeResponses({ ...intakeResponses, [field.label]: e.target.value })} placeholder={field.placeholder} required={field.required} />
                                                                    ) : (
                                                                        <input type={field.type} className="form-input" style={{ height: 44, borderRadius: 12, background: 'rgba(0,0,0,0.2)' }} value={intakeResponses[field.label] || ''} onChange={e => setIntakeResponses({ ...intakeResponses, [field.label]: e.target.value })} placeholder={field.placeholder} required={field.required} />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="form-group">
                                                            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Special Instructions</label>
                                                            <textarea className="form-input" style={{ minHeight: 120, borderRadius: 16, padding: 16, background: 'rgba(0,0,0,0.2)' }} value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} placeholder="Anything we should know before your arrival?" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* Step 3: Schedule */}
                                <section className="animate-slide-up">
                                    <div style={{ marginBottom: 32 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                            <span style={{ background: 'var(--gradient-primary)', color: 'white', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>{ (selectedService.addons?.length > 0 || selectedService.intakeFields?.length > 0) ? 3 : 2 }</span>
                                            <h2 style={{ fontSize: '1.6rem', margin: 0, letterSpacing: '-0.03em' }}>Choose Expert & Date</h2>
                                        </div>
                                        <p style={{ color: 'var(--color-text-3)', fontSize: '0.95rem', marginLeft: 40 }}>Select your preferred professional and checking availability.</p>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) 1.5fr', gap: 32, alignItems: 'start' }}>
                                        <div>
                                            <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', marginBottom: 20, letterSpacing: '0.1em', fontWeight: 800 }}>AVAILABLE STAFF</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {staff.map(m => (
                                                    <div 
                                                        key={m._id}
                                                        onClick={() => dispatch(setSelectedStaff(m))}
                                                        className={`card-premium hover-lift ${selectedStaff?._id === m._id ? 'selected' : ''}`}
                                                        style={{ 
                                                            cursor: 'pointer', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, borderRadius: 20,
                                                            border: selectedStaff?._id === m._id ? '1.5px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.03)',
                                                            background: selectedStaff?._id === m._id ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.01)'
                                                        }}
                                                    >
                                                        <div style={{ position: 'relative' }}>
                                                            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}>{m.name.charAt(0)}</div>
                                                            {selectedStaff?._id === m._id && <div style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: 'var(--color-success)', border: '3px solid var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={10} color="white" strokeWidth={5} /></div>}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{m.name}</div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Certified Professional</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', marginBottom: 20, letterSpacing: '0.1em', fontWeight: 800 }}>SELECT APPOINTMENT DATE</h4>
                                            <div className="card-glass" style={{ padding: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                                    <h4 style={{ margin: 0, fontSize: '0.9rem', letterSpacing: '0.05em', fontWeight: 700 }}>{format(currentMonth, 'MMMM yyyy').toUpperCase()}</h4>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-secondary" style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}><ChevronLeft size={16} /></button>
                                                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-secondary" style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}><ChevronRight size={16} /></button>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-3)', paddingBottom: 12 }}>{d}</div>)}
                                                    {(() => {
                                                        const start = startOfWeek(startOfMonth(currentMonth));
                                                        const end = endOfWeek(endOfMonth(currentMonth));
                                                        return eachDayOfInterval({ start, end }).map(d => {
                                                            const val = format(d, 'yyyy-MM-dd');
                                                            const isSelected = selectedDate === val;
                                                            const isCurrentMonth = isSameMonth(d, currentMonth);
                                                            const isPast = isBefore(startOfDay(d), startOfDay(new Date()));
                                                            const today = isToday(d);
                                                            return (
                                                                <div 
                                                                    key={val} 
                                                                    onClick={() => !isPast && dispatch(setSelectedDate(val))} 
                                                                    style={{ 
                                                                        height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isPast ? 'not-allowed' : 'pointer', borderRadius: 12, transition: 'all 0.2s',
                                                                        background: isSelected ? 'var(--color-primary)' : today ? 'rgba(99,102,241,0.1)' : 'transparent',
                                                                        border: today && !isSelected ? '1px solid var(--color-primary-light)' : '1px solid transparent',
                                                                        color: isSelected ? 'white' : isCurrentMonth ? (isPast ? 'rgba(255,255,255,0.1)' : 'inherit') : 'rgba(255,255,255,0.05)',
                                                                        fontWeight: isSelected || today ? 800 : 500, fontSize: '0.9rem'
                                                                    }}
                                                                >
                                                                    {format(d, 'd')}
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Step 4: Time Slot */}
                                {selectedStaff && selectedDate && (
                                    <section className="animate-fade-in">
                                        <div style={{ marginBottom: 32 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                                <span style={{ background: 'var(--gradient-primary)', color: 'white', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>{ (selectedService.addons?.length > 0 || selectedService.intakeFields?.length > 0) ? 4 : 3 }</span>
                                                <h2 style={{ fontSize: '1.6rem', margin: 0, letterSpacing: '-0.03em' }}>Select Preferred Time</h2>
                                            </div>
                                            <div style={{ display: 'flex', gap: 10, marginLeft: 40 }}>
                                                <span className="badge badge-primary" style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700 }}><Calendar size={12} /> {format(new Date(selectedDate), 'EEE, MMM d')}</span>
                                                <span className="badge badge-gray" style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700 }}><User size={12} /> {selectedStaff.name}</span>
                                            </div>
                                        </div>

                                        <div className="card-glass" style={{ padding: 32, borderRadius: 24, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            {loadingSlots ? (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>{Array(12).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 12 }} />)}</div>
                                            ) : slots.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><Info size={28} style={{ opacity: 0.2 }} /></div>
                                                    <h4 style={{ margin: '0 0 10px', fontWeight: 700 }}>No Slots Available</h4>
                                                    <p style={{ margin: '0 0 24px', fontSize: '0.85rem', color: 'var(--color-text-3)' }}>This date is fully booked. Join the waitlist for priority notification.</p>
                                                    <button onClick={handleJoinWaitlist} disabled={submitting} className="btn-secondary" style={{ padding: '10px 24px', borderRadius: 12, background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary-light)', fontWeight: 700 }}>
                                                       {submitting ? 'JOINING...' : '✋ JOIN WAITLIST'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
                                                    {slots.map(s => {
                                                        const isSelected = selectedSlot === s;
                                                        return (
                                                            <div 
                                                                key={s} 
                                                                onClick={() => dispatch(setSelectedSlot(s))}
                                                                style={{ 
                                                                    height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 14, transition: 'all 0.3s',
                                                                    background: isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)'),
                                                                    fontWeight: isSelected ? 800 : 600, color: isSelected ? 'white' : 'var(--color-text-2)', fontSize: '0.9rem'
                                                                }}
                                                                className={isSelected ? 'shadow-glow-sm' : 'hover-lift'}
                                                            >
                                                                {s}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Checkout Sidebar */}
                    <aside style={{ position: 'sticky', top: 100, zIndex: 50 }}>
                        <div className="card-premium" style={{ padding: 32, borderRadius: 28, background: 'rgba(15, 15, 25, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px -15px rgba(0,0,0,0.6)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                                <div style={{ background: 'rgba(139, 92, 246, 0.1)', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139, 92, 246, 0.2)' }}><ShoppingBag size={20} className="text-primary" /></div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Reservation Details</h3>
                            </div>

                            {!selectedService ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.08)' }}>
                                    <Sparkles size={32} style={{ opacity: 0.1, marginBottom: 16 }} />
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-3)', lineHeight: 1.5 }}>Your journey begins with selecting a service on the left.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    {/* Primary Choice */}
                                    <div className="animate-fade-in">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{selectedService.name}</span>
                                            <span style={{ fontWeight: 800 }}>₹{selectedService.price}</span>
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{selectedService.duration} MIN TREATMENT</div>
                                    </div>

                                    {/* Add-ons */}
                                    {selectedAddons.length > 0 && (
                                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-3)', letterSpacing: '0.12em' }}>CURATED EXTRAS</div>
                                            {selectedAddons.map(a => (
                                                <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                    <span style={{ color: 'var(--color-text-2)' }}>{a.name}</span>
                                                    <span style={{ fontWeight: 700 }}>+₹{a.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Summary Badges */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {selectedStaff && <span className="badge badge-primary" style={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}><User size={10} /> {selectedStaff.name}</span>}
                                        {selectedDate && <span className="badge badge-gray" style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}><Calendar size={10} /> {format(new Date(selectedDate), 'MMM d')}</span>}
                                        {selectedSlot && <span className="badge badge-success" style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}><Clock size={10} /> {selectedSlot}</span>}
                                    </div>

                                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }}></div>

                                    {/* Recurring Option */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 16, border: '1px solid ' + (recurrence.isRecurring ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)') }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: recurrence.isRecurring ? 12 : 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Clock size={14} className={recurrence.isRecurring ? 'text-primary' : 'text-muted'} />
                                                <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>Recurring Series</div>
                                            </div>
                                            <label className="switch" style={{ scale: '0.8' }}>
                                                <input type="checkbox" checked={recurrence.isRecurring} onChange={e => setRecurrence({ ...recurrence, isRecurring: e.target.checked })} />
                                                <span className="slider round"></span>
                                            </label>
                                        </div>
                                        {recurrence.isRecurring && (
                                            <div className="animate-slide-down" style={{ display: 'flex', gap: 8 }}>
                                                <select className="form-input" style={{ flex: 1, height: 32, fontSize: '0.75rem', borderRadius: 8, background: 'rgba(0,0,0,0.3)' }} value={recurrence.frequency} onChange={e => setRecurrence({ ...recurrence, frequency: e.target.value })}>
                                                    <option value="weekly">Weekly</option>
                                                    <option value="monthly">Monthly</option>
                                                </select>
                                                <input type="number" min="2" max="12" className="form-input" style={{ width: 50, height: 32, fontSize: '0.75rem', borderRadius: 8, textAlign: 'center', background: 'rgba(0,0,0,0.3)' }} value={recurrence.count} onChange={e => setRecurrence({ ...recurrence, count: parseInt(e.target.value) || 2 })} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Pricing & Coupon */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-2)' }}>
                                            <span>Subtotal</span>
                                            <span style={{ fontWeight: 700 }}>₹{totalAmount}</span>
                                        </div>
                                        
                                        {!discountInfo ? (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <input 
                                                    type="text" className="form-input" style={{ height: 38, borderRadius: 10, fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)' }} 
                                                    placeholder="Enter promo code" value={couponCode} onChange={e => setCouponCode(e.target.value)} 
                                                />
                                                <button className="btn-secondary" style={{ padding: '0 16px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700 }} onClick={handleApplyCoupon} disabled={validatingCoupon || !couponCode}>
                                                    {validatingCoupon ? '...' : 'APPLY'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', background: 'rgba(16,185,129,0.05)', padding: '10px 14px', borderRadius: 12, fontSize: '0.8rem' }}>
                                                <div style={{ display: 'flex', flexDirecton: 'column' }}>
                                                    <div style={{ fontWeight: 800 }}>PROMO APPLIED</div>
                                                    <div style={{ opacity: 0.7 }}>Save ₹{totalAmount - finalAmount}</div>
                                                </div>
                                                <X size={16} style={{ cursor: 'pointer' }} onClick={() => { setDiscountInfo(null); setCouponCode(''); }} />
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>TOTAL</span>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--color-primary-light)', letterSpacing: '-0.05em', lineHeight: 1 }}>₹{finalAmount}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-3)', fontWeight: 800, marginTop: 4, letterSpacing: '0.05em' }}>TAX INCLUDED</div>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        className="btn-primary" 
                                        style={{ height: 60, borderRadius: 18, fontSize: '1.1rem', fontWeight: 800, justifyContent: 'center', boxShadow: '0 20px 40px -8px rgba(99,102,241,0.3)', marginTop: 8, position: 'relative', overflow: 'hidden' }}
                                        disabled={!selectedSlot || submitting}
                                        onClick={handleBook}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {submitting ? 'CONFIRMING...' : (isAuthenticated ? 'BOOK APPOINTMENT' : 'LOGIN TO CONTINUE')}
                                            {!submitting && <ArrowRight size={20} />}
                                        </div>
                                    </button>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', color: 'var(--color-text-3)', fontSize: '0.7rem', fontWeight: 700 }}>
                                        <ShieldCheck size={14} className="text-success" /> 256-BIT SSL SECURED
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
