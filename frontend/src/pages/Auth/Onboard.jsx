import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Zap, Building2, Mail, Lock, Phone, MapPin, FileText, CheckCircle2 } from 'lucide-react';

const steps = ['Business Info', 'Account Setup', 'Done'];

export default function Onboard() {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({ businessName: '', slug: '', email: '', password: '', phone: '', address: '', description: '' });
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const updates = { [e.target.name]: e.target.value };
        if (e.target.name === 'businessName') {
            updates.slug = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
        setForm({ ...form, ...updates });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/tenants/onboard', form);
            dispatch(setCredentials({ user: data.data.admin, accessToken: data.data.accessToken, refreshToken: data.data.refreshToken }));
            setStep(2);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Onboarding failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 70% 0%, rgba(139,92,246,0.12) 0%, var(--color-bg) 70%)', padding: 20 }}>
            <div style={{ width: '100%', maxWidth: 520, animation: 'slideUp 0.5s ease' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}><Zap size={22} color="white" /></div>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)' }}>BookFlow</span>
                    </Link>
                    {/* Step indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                        {steps.map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, background: i <= step ? 'var(--gradient-primary)' : 'var(--color-surface-2)', color: i <= step ? 'white' : 'var(--color-text-3)', transition: 'all 0.3s ease' }}>{i + 1}</div>
                                {i < steps.length - 1 && <div style={{ width: 40, height: 2, background: i < step ? 'var(--color-primary)' : 'var(--color-border-light)', transition: 'background 0.3s ease' }} />}
                            </div>
                        ))}
                    </div>
                    <h2 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Register Your Business</h2>
                    <p style={{ color: 'var(--color-text-2)', fontSize: '0.9rem' }}>Set up your booking platform in minutes</p>
                </div>

                <div className="card-glass" style={{ padding: 36 }}>
                    {step === 2 ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <CheckCircle2 size={32} color="#10b981" />
                            </div>
                            <h3>You're all set! 🎉</h3>
                            <p style={{ marginTop: 8, color: 'var(--color-text-2)' }}>Redirecting to your dashboard...</p>
                        </div>
                    ) : (
                        <form onSubmit={step === 0 ? (e) => { e.preventDefault(); setStep(1); } : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {step === 0 && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Business Name *</label>
                                        <div style={{ position: 'relative' }}>
                                            <Building2 size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                                            <input className="form-input" style={{ paddingLeft: 38 }} name="businessName" placeholder="Sunrise Salon" value={form.businessName} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Business Slug (URL identifier)</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', fontSize: '0.85rem' }}>bookflow.io/book/</span>
                                            <input className="form-input" style={{ paddingLeft: 130 }} name="slug" placeholder="sunrise-salon" value={form.slug} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <div style={{ position: 'relative' }}>
                                            <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                                            <input className="form-input" style={{ paddingLeft: 38 }} name="phone" placeholder="+91 9876543210" value={form.phone} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Address</label>
                                        <div style={{ position: 'relative' }}>
                                            <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                                            <input className="form-input" style={{ paddingLeft: 38 }} name="address" placeholder="123 Main Street, Hyderabad" value={form.address} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <div style={{ position: 'relative' }}>
                                            <FileText size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--color-text-3)' }} />
                                            <textarea className="form-textarea" style={{ paddingLeft: 38, minHeight: 80 }} name="description" placeholder="What services do you offer?" value={form.description} onChange={handleChange} />
                                        </div>
                                    </div>
                                </>
                            )}
                            {step === 1 && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Admin Email *</label>
                                        <div style={{ position: 'relative' }}>
                                            <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                                            <input className="form-input" style={{ paddingLeft: 38 }} name="email" type="email" placeholder="admin@yourbusiness.com" value={form.email} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Password *</label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                                            <input className="form-input" style={{ paddingLeft: 38 }} name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required minLength={6} />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                {step > 0 && <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(step - 1)}>← Back</button>}
                                <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 2 }}>
                                    {loading ? 'Launching...' : step === 0 ? 'Next →' : 'Launch My Platform 🚀'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--color-text-2)', fontSize: '0.9rem' }}>
                    Already registered? <Link to="/login">Sign in →</Link>
                </p>
            </div>
        </div>
    );
}
