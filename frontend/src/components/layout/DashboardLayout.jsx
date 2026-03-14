import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import {
    LayoutDashboard, Calendar, Users, Briefcase, BarChart3,
    Settings, LogOut, Clock, ChevronRight, Zap
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const adminLinks = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
    { to: '/dashboard/services', label: 'Services', icon: Briefcase },
    { to: '/dashboard/staff', label: 'Staff', icon: Users },
    { to: '/dashboard/schedules', label: 'Schedules', icon: Clock },
    { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const staffLinks = [
    { to: '/staff-dashboard', label: 'My Bookings', icon: Calendar, end: true },
];

const sadminLinks = [
    { to: '/sadmin', label: 'Tenants', icon: LayoutDashboard, end: true },
];

export default function DashboardLayout() {
    const { user } = useSelector((s) => s.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const links =
        user?.role === 'staff' ? staffLinks :
            user?.role === 'super_admin' ? sadminLinks :
                adminLinks;

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
                width: 'var(--sidebar-width)', background: 'var(--color-bg-2)',
                borderRight: '1px solid var(--color-border-light)',
                display: 'flex', flexDirection: 'column',
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
            }}>
                {/* Logo */}
                <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--color-border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Zap size={18} color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>BookFlow</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'staff' ? 'Staff' : 'Admin'}
                            </div>
                        </div>
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
                            boxShadow: isActive ? 'var(--shadow-glow-sm)' : 'none',
                            transition: 'all 0.2s ease',
                        })}>
                            <Icon size={18} />
                            {label}
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
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn btn-ghost w-full" style={{ justifyContent: 'center' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, padding: '32px', minHeight: '100vh' }}>
                <Outlet />
            </main>
        </div>
    );
}
