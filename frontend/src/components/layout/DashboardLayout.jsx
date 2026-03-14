import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import {
    LayoutDashboard, Calendar, Users, Briefcase, BarChart3,
    Settings, LogOut, Clock, ChevronRight, Zap, Menu, ChevronLeft
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const adminLinks = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
    { to: '/dashboard/waitlist', label: 'Waitlist', icon: Clock },
    { to: '/dashboard/services', label: 'Services', icon: Briefcase },
    { to: '/dashboard/staff', label: 'Staff', icon: Users },
    { to: '/dashboard/schedules', label: 'Schedules', icon: Clock },
    { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const staffLinks = [
    { to: '/staff-dashboard', label: 'My Bookings', icon: Calendar, end: true },
];

const customerLinks = [
    { to: '/customer', label: 'My Bookings', icon: Calendar, end: true },
    { to: '/customer/history', label: 'History', icon: Clock },
];

const sadminLinks = [
    { to: '/sadmin', label: 'Tenants', icon: LayoutDashboard, end: true },
];

export default function DashboardLayout() {
    const { user } = useSelector((s) => s.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const links =
        user?.role?.name === 'staff' ? staffLinks :
            user?.role?.name === 'super_admin' ? sadminLinks :
                user?.role?.name === 'customer' ? customerLinks :
                    adminLinks; // adminLinks for both 'tenant_admin', 'dashboard', and 'manager'

    const handleLogout = async () => {
        try { await api.post('/auth/logout'); } catch (_) { }
        dispatch(logout());
        navigate('/login');
        toast.success('Logged out successfully');
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: collapsed ? 80 : 260, 
                background: 'var(--color-bg-2)',
                borderRight: '1px solid var(--color-border-light)',
                display: 'flex', flexDirection: 'column',
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
            }}>
                {/* Toggle Button - Floating Pull Tab Style */}
                <button 
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        position: 'absolute', right: -12, top: 32,
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border-light)',
                        color: 'var(--color-text-2)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 120, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '4px 0 10px rgba(0,0,0,0.2)'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.color = 'var(--color-primary-light)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.color = 'var(--color-text-2)';
                    }}
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Content Wrapper to handle clipping during transition */}
                <div style={{
                    display: 'flex', flexDirection: 'column', height: '100%',
                    width: collapsed ? 80 : 260,
                    overflow: 'hidden',
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                    {/* Logo Area */}
                    <div style={{ 
                        padding: collapsed ? '24px 0' : '24px 20px', 
                        borderBottom: '1px solid var(--color-border-light)',
                        display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start',
                        flexShrink: 0
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Zap size={18} color="white" />
                        </div>
                        {!collapsed && (
                            <div style={{ animation: 'fade-in 0.2s ease' }}>
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>BookFlow</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {user?.role?.name === 'super_admin' ? 'Super Admin' : 
                                 user?.role?.name === 'manager' ? 'Manager' :
                                 user?.role?.name === 'dashboard' ? 'Dashboard' :
                                 user?.role?.name === 'staff' ? 'Staff' : 
                                 user?.role?.name === 'customer' ? 'Customer' : 'Admin'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav Links */}
                <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {links.map(({ to, label, icon: Icon, end }) => (
                        <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 'var(--radius-md)',
                            textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
                            color: isActive ? 'white' : 'var(--color-text-2)',
                            background: isActive ? 'var(--gradient-primary)' : 'transparent',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            boxShadow: isActive ? 'var(--shadow-glow-sm)' : 'none',
                            transition: 'all 0.2s ease',
                        })}>
                            <Icon size={18} style={{ flexShrink: 0 }} />
                            {!collapsed && <span style={{ animation: 'fade-in 0.2s ease' }}>{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User info + logout */}
                <div style={{ padding: '16px 12px', borderTop: '1px solid var(--color-border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 8 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.9rem', color: 'white', flexShrink: 0,
                        }}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        {!collapsed && (
                            <div style={{ overflow: 'hidden', animation: 'fade-in 0.2s ease' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                            </div>
                        )}
                    </div>
                    <button onClick={handleLogout} className="btn btn-ghost w-full" style={{ justifyContent: 'center', padding: collapsed ? '10px 0' : '10px 12px' }}>
                        <LogOut size={16} /> {!collapsed && <span style={{ marginLeft: 8 }}>Logout</span>}
                    </button>
                </div>
            </div>
        </aside>

            {/* Main content */}
            <main style={{ 
                marginLeft: collapsed ? 80 : 260, 
                transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                flex: 1, padding: '32px', minHeight: '100vh' 
            }}>
                <Outlet />
            </main>
        </div>
    );
}
