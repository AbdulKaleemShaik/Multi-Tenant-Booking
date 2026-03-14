import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, ChevronRight, XCircle, CheckCircle, AlertCircle, Star } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function CustomerDashboard() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewBooking, setReviewBooking] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await api.get('/bookings');
            setBookings(res.data.data);
        } catch (err) {
            toast.error('Failed to load your bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await api.put(`/bookings/${id}/status`, { status: 'cancelled', cancellationReason: 'Cancelled by customer' });
            toast.success('Booking cancelled successfully');
            fetchBookings();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const handleSubmitReview = async () => {
        setSubmittingReview(true);
        try {
            await api.post('/reviews', {
                bookingId: reviewBooking._id,
                rating,
                comment
            });
            toast.success('Thank you for your review!');
            setReviewBooking(null);
            setRating(5);
            setComment('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'confirmed': return { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', icon: CheckCircle };
            case 'pending': return { bg: 'rgba(234,179,8,0.1)', color: '#eab308', icon: AlertCircle };
            case 'cancelled': return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', icon: XCircle };
            default: return { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', icon: Clock };
        }
    };

    if (loading) return (
        <div>
            <div className="skeleton mb-4" style={{ height: 40, width: 200, borderRadius: 8 }} />
            <div style={{ display: 'grid', gap: 16 }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />)}
            </div>
        </div>
    );

    return (
        <div className="animate-slide-up">
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>My Bookings</h1>
                <p style={{ color: 'var(--color-text-2)' }}>Manage your appointments and view your booking history.</p>
            </div>

            {bookings.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--gradient-surface)' }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: '50%', background: 'rgba(99,102,241,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                    }}>
                        <Calendar size={30} color="var(--color-primary-light)" />
                    </div>
                    <h3 style={{ marginBottom: 12 }}>No Bookings Yet</h3>
                    <p style={{ color: 'var(--color-text-3)', maxWidth: 300, margin: '0 auto 24px' }}>
                        You haven't made any appointments. Find a local business to get started!
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>Find Businesses</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {bookings.map((b) => {
                        const status = getStatusStyle(b.status);
                        const StatusIcon = status.icon;
                        const isUpcoming = b.status !== 'cancelled' && b.status !== 'completed' && new Date(b.bookingDate) > new Date();

                        return (
                            <div key={b._id} className="card hover-lift" style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '24px',
                                borderLeft: `4px solid ${status.color}`
                            }}>
                                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                                    <div style={{ textAlign: 'center', paddingRight: 16, borderRight: '1px solid var(--color-border-light)' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', fontWeight: 600, textTransform: 'uppercase' }}>
                                            {format(new Date(b.bookingDate), 'MMM')}
                                        </div>
                                        <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>
                                            {format(new Date(b.bookingDate), 'd')}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{b.serviceId?.name || 'Service Deleted'}</h3>
                                            <div style={{ 
                                                display: 'flex', alignItems: 'center', gap: 4, 
                                                padding: '2px 10px', borderRadius: 20, 
                                                background: status.bg, color: status.color, 
                                                fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
                                            }}>
                                                <StatusIcon size={12} /> {b.status}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, color: 'var(--color-text-2)', fontSize: '0.9rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={14} /> {b.startTime} - {b.endTime}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <MapPin size={14} /> {b.staffId?.name || 'Any Staff'}
                                            </span>
                                        </div>
                                        <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--color-text-3)' }}>
                                            Ref: <code>{b.bookingRef}</code>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 12 }}>
                                    {isUpcoming && (
                                        <button 
                                            onClick={() => handleCancel(b._id)}
                                            className="btn btn-ghost"
                                            style={{ color: 'var(--color-error)', border: '1px solid var(--color-error-light)' }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    {(b.status === 'completed' || b.status === 'confirmed') && (
                                        <button 
                                            className="btn btn-ghost" 
                                            onClick={() => setReviewBooking(b)}
                                            style={{ color: 'var(--color-warning)', border: '1px solid var(--color-warning)' }}
                                        >
                                            <Star size={16} fill={b.status === 'completed' ? 'var(--color-warning)' : 'none'} /> Review
                                        </button>
                                    )}
                                    <button className="btn btn-ghost" onClick={() => navigate(`/book/demo`)}> 
                                        Rebook <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Review Modal */}
            {reviewBooking && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000, padding: 20
                }}>
                    <div className="card-glass" style={{ width: '100%', maxWidth: 450, padding: 32 }}>
                        <h2 style={{ marginBottom: 12 }}>Leave a Review</h2>
                        <p style={{ color: 'var(--color-text-2)', marginBottom: 24, fontSize: '0.9rem' }}>
                            How was your experience with <strong>{reviewBooking.serviceId?.name}</strong>?
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <button 
                                    key={star} 
                                    onClick={() => setRating(star)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                                >
                                    <Star 
                                        size={32} 
                                        color={star <= rating ? 'var(--color-warning)' : 'var(--color-text-3)'} 
                                        fill={star <= rating ? 'var(--color-warning)' : 'none'}
                                        style={{ transition: 'all 0.2s ease' }}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="form-group mb-6">
                            <label className="form-label">Review Comment</label>
                            <textarea 
                                className="form-textarea" 
                                placeholder="Share your experience (optional)..." 
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                style={{ minHeight: 100 }}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setReviewBooking(null)}>Cancel</button>
                            <button 
                                className="btn btn-primary" 
                                style={{ flex: 2 }} 
                                disabled={submittingReview}
                                onClick={handleSubmitReview}
                            >
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
