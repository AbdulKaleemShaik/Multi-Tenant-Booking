import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, Building2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '', tenantSlug: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', form);
            dispatch(setCredentials(data.data));
            toast.success(`Welcome back, ${data.data.user.name}!`);
            const role = data.data.user.role;
            if (role === 'super_admin') navigate('/sadmin');
            else if (role === 'staff') navigate('/staff-dashboard');
            else navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, var(--color-bg) 70%)',
            padding: 20,
        }}>
            {/* Background orbs */}
            <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: 440, animation: 'slideUp 0.5s ease' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
                            <Zap size={22} color="white" />
                        </div>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>BookFlow</span>
                    </div>
                    <p style={{ color: 'var(--color-text-2)', marginTop: 4 }}>Sign in to your account</p>
                </div>

                <div className="card-glass" style={{ padding: 32 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div className="form-group">
                            <label className="form-label">Business Slug <span style={{ color: 'var(--color-text-3)', fontWeight: 400 }}>(leave empty for Super Admin)</span></label>
                            <div style={{ position: 'relative' }}>
                                <Building2 size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                                <input className="form-input" style={{ paddingLeft: 38 }} name="tenantSlug" placeholder="your-business-slug" value={form.tenantSlug} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                                <input className="form-input" style={{ paddingLeft: 38 }} name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                                <input className="form-input" style={{ paddingLeft: 38, paddingRight: 40 }} name="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={handleChange} required />
                                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer' }}>
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                            {loading ? <span className="animate-spin" style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> : 'Sign In'}
                        </button>
                    </form>
                    <div className="divider" />
                    <p style={{ textAlign: 'center', color: 'var(--color-text-2)', fontSize: '0.9rem' }}>
                        New business? <Link to="/onboard">Get started free →</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
