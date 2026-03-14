import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, User, Briefcase, Copy } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function BookingConfirm() {
    const { tenantSlug } = useParams();
    const { currentBooking } = useSelector(s => s.booking);

    if (!currentBooking) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <p>No booking found.</p>
                <Link to={`/book/${tenantSlug}`} className="btn btn-primary mt-4">Book Again</Link>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.1) 0%, var(--color-bg) 60%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ width: '100%', maxWidth: 480, animation: 'slideUp 0.5s ease' }}>
                {/* Success Icon */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 40px rgba(16,185,129,0.2)' }}>
                        <CheckCircle2 size={44} color="#10b981" />
                    </div>
                    <h2>Booking Confirmed! 🎉</h2>
                    <p style={{ color: 'var(--color-text-2)', marginTop: 6 }}>A confirmation has been sent to your email.</p>
                </div>

                {/* Booking Card */}
                <div className="card-glass" style={{ padding: 28 }}>
                    {/* Ref */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--color-bg-2)', borderRadius: 10, marginBottom: 20 }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booking Reference</div>
                            <code style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>{currentBooking.bookingRef}</code>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(currentBooking.bookingRef); toast.success('Copied!'); }}><Copy size={14} /></button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[
                            { icon: Briefcase, label: 'Service', value: currentBooking.serviceId?.name, sub: `${currentBooking.serviceId?.duration} min`, color: '#6366f1' },
                            { icon: User, label: 'Staff', value: currentBooking.staffId?.name, color: '#8b5cf6' },
                            { icon: Calendar, label: 'Date', value: currentBooking.bookingDate ? format(new Date(currentBooking.bookingDate), 'EEEE, MMMM d, yyyy') : '—', color: '#06b6d4' },
                            { icon: Clock, label: 'Time', value: `${currentBooking.startTime} – ${currentBooking.endTime}`, color: '#10b981' },
                        ].map(({ icon: Icon, label, value, sub, color }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={17} color={color} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>{label}</div>
                                    <div style={{ fontWeight: 600 }}>{value} {sub && <span style={{ fontWeight: 400, color: 'var(--color-text-2)', fontSize: '0.85rem' }}>· {sub}</span>}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="divider" />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-text-2)' }}>Total Paid</span>
                        <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-primary-light)' }}>₹{currentBooking.totalAmount?.toLocaleString()}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                        <Link to={`/book/${tenantSlug}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Book Again</Link>
                        <Link to="/" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Go Home</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
