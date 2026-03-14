import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, User, Phone } from 'lucide-react';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const tenantSlug = searchParams.get('tenant');
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', { ...form, tenantSlug });
            dispatch(setCredentials(data.data));
            toast.success('Account created!');
            navigate(tenantSlug ? `/book/${tenantSlug}` : '/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 30% 0%, rgba(99,102,241,0.12) 0%, var(--color-bg) 70%)', padding: 20 }}>
            <div style={{ width: '100%', maxWidth: 440, animation: 'slideUp 0.5s ease' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 8 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}><Zap size={22} color="white" /></div>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)' }}>BookFlow</span>
                    </Link>
                    <p style={{ color: 'var(--color-text-2)' }}>{tenantSlug ? `Create account to book appointments` : 'Create a customer account'}</p>
                </div>
                <div className="card-glass" style={{ padding: 32 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                            { name: 'name', label: 'Full Name', icon: User, type: 'text', placeholder: 'John Doe', required: true },
                            { name: 'email', label: 'Email Address', icon: Mail, type: 'email', placeholder: 'you@example.com', required: true },
                            { name: 'password', label: 'Password', icon: Lock, type: 'password', placeholder: '••••••••', required: true },
                            { name: 'phone', label: 'Phone Number', icon: Phone, type: 'tel', placeholder: '+91 9876543210' },
                        ].map(({ name, label, icon: Icon, type, placeholder, required }) => (
                            <div className="form-group" key={name}>
                                <label className="form-label">{label}</label>
                                <div style={{ position: 'relative' }}>
                                    <Icon size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                                    <input className="form-input" style={{ paddingLeft: 38 }} name={name} type={type} placeholder={placeholder} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} required={required} />
                                </div>
                            </div>
                        ))}
                        <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                    <div className="divider" />
                    <p style={{ textAlign: 'center', color: 'var(--color-text-2)', fontSize: '0.9rem' }}>
                        Already have an account? <Link to="/login">Sign in →</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
