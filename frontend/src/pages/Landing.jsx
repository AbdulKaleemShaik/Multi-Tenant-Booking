import { Link } from 'react-router-dom';
import { Zap, Calendar, Users, BarChart3, Shield, Globe, ArrowRight, Check, Star } from 'lucide-react';

const features = [
    { icon: Calendar, title: 'Smart Scheduling', desc: 'Auto-generate slots, handle conflicts, and manage staff availability effortlessly.' },
    { icon: Users, title: 'Multi-Tenant', desc: 'Each business gets fully isolated data, custom branding, and their own booking URL.' },
    { icon: BarChart3, title: 'Live Analytics', desc: 'Revenue, peak hours, top services, and growth trends — all in real time.' },
    { icon: Shield, title: 'Secure Payments', desc: 'Stripe-powered checkout with automatic refunds and webhook confirmation.' },
    { icon: Globe, title: 'White-Label', desc: 'Custom colors, logo, and a shareable booking link for each business.' },
    { icon: Star, title: 'Role-Based Access', desc: 'Admin, Staff, and Customer roles with fine-grained permission control.' },
];

const plans = [
    { name: 'Free', price: '₹0', desc: 'Perfect to get started', features: ['1 Staff Member', '50 Bookings/month', 'Basic Analytics', 'Email Notifications'] },
    { name: 'Starter', price: '₹999', desc: 'Growing businesses', features: ['5 Staff Members', '500 Bookings/month', 'Full Analytics', 'Stripe Payments', 'Priority Support'], popular: true },
    { name: 'Pro', price: '₹2,999', desc: 'Enterprise teams', features: ['Unlimited Staff', 'Unlimited Bookings', 'Advanced Analytics', 'Custom Domain', 'API Access', 'Dedicated Support'] },
];

export default function Landing() {
    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
            {/* Navbar */}
            <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 60px', borderBottom: '1px solid var(--color-border-light)', position: 'sticky', top: 0, background: 'rgba(15,15,26,0.85)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, background: 'var(--gradient-primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={20} color="white" /></div>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>BookFlow</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Link to="/login" className="btn btn-secondary">Sign In</Link>
                    <Link to="/onboard" className="btn btn-primary">Start Free →</Link>
                </div>
            </nav>

            {/* Hero */}
            <section style={{ textAlign: 'center', padding: '100px 20px 80px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 'var(--radius-full)', padding: '6px 16px', marginBottom: 24, fontSize: '0.85rem', color: 'var(--color-primary-light)' }}>
                    <Zap size={14} /> Multi-Tenant SaaS Booking Platform
                </div>
                <h1 style={{ maxWidth: 700, margin: '0 auto 24px', background: 'linear-gradient(135deg, #fff 40%, var(--color-primary-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    The Booking Platform Built for Modern Businesses
                </h1>
                <p style={{ maxWidth: 560, margin: '0 auto 40px', fontSize: '1.1rem', color: 'var(--color-text-2)', lineHeight: 1.7 }}>
                    One platform, infinite businesses. White-label booking software with smart scheduling, Stripe payments, and real-time analytics.
                </p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/onboard" className="btn btn-primary btn-lg">
                        Launch Your Platform <ArrowRight size={18} />
                    </Link>
                    {/* <Link to="/book/demo" className="btn btn-secondary btn-lg">
                        See Live Demo
                    </Link> */}
                </div>
                {/* Stats */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 64, flexWrap: 'wrap' }}>
                    {[['500+', 'Businesses'], ['50K+', 'Bookings'], ['4.9★', 'Rating'], ['99.9%', 'Uptime']].map(([val, label]) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</div>
                            <div style={{ color: 'var(--color-text-2)', fontSize: '0.9rem' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '80px 60px', background: 'var(--color-bg-2)' }}>
                <div style={{ textAlign: 'center', marginBottom: 56 }}>
                    <h2>Everything You Need to Run a Booking Business</h2>
                    <p style={{ marginTop: 12, color: 'var(--color-text-2)', maxWidth: 500, margin: '12px auto 0' }}>Powerful features that scale with your business — from solo freelancers to enterprise teams.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
                    {features.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-glow-sm)' }}>
                                <Icon size={20} color="white" />
                            </div>
                            <div>
                                <h4 style={{ marginBottom: 6 }}>{title}</h4>
                                <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing */}
            <section style={{ padding: '80px 20px' }}>
                <div style={{ textAlign: 'center', marginBottom: 56 }}>
                    <h2>Simple, Transparent Pricing</h2>
                    <p style={{ marginTop: 12, color: 'var(--color-text-2)' }}>Start free. Upgrade when you grow.</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', maxWidth: 900, margin: '0 auto' }}>
                    {plans.map(({ name, price, desc, features: f, popular }) => (
                        <div key={name} style={{
                            background: popular ? 'var(--color-surface)' : 'var(--color-bg-2)',
                            border: `1px solid ${popular ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                            borderRadius: 'var(--radius-xl)', padding: '32px 28px', width: 280,
                            transform: popular ? 'scale(1.03)' : 'none',
                            boxShadow: popular ? 'var(--shadow-glow)' : 'none',
                            position: 'relative',
                        }}>
                            {popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--gradient-primary)', color: 'white', padding: '4px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Most Popular</div>}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary-light)', marginBottom: 4 }}>{name}</div>
                                <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{price}<span style={{ fontSize: '1rem', color: 'var(--color-text-2)', fontWeight: 400 }}>/mo</span></div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-2)' }}>{desc}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                                {f.map((feat) => (
                                    <div key={feat} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.9rem' }}>
                                        <Check size={16} color="var(--color-success)" style={{ flexShrink: 0 }} /> {feat}
                                    </div>
                                ))}
                            </div>
                            <Link to="/onboard" className={`btn w-full ${popular ? 'btn-primary' : 'btn-secondary'}`} style={{ display: 'flex', justifyContent: 'center' }}>Get Started</Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--color-border-light)', padding: '32px 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, background: 'var(--gradient-primary)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={14} color="white" /></div>
                    <span style={{ fontWeight: 700 }}>BookFlow</span>
                </div>
                <p style={{ color: 'var(--color-text-3)', fontSize: '0.85rem' }}>© 2024 BookFlow. Built with MERN Stack.</p>
            </footer>
        </div>
    );
}
