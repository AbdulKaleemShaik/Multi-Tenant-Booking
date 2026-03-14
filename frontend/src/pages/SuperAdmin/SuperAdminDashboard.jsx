import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Building2, Users, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function SuperAdminDashboard() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/tenants').then(r => setTenants(r.data.data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const toggleActive = async (id, current) => {
        try {
            await api.put(`/tenants/${id}`, { isActive: !current });
            setTenants(prev => prev.map(t => t._id === id ? { ...t, isActive: !current } : t));
            toast.success(`Tenant ${!current ? 'activated' : 'deactivated'}`);
        } catch (_) { toast.error('Failed'); }
    };

    return (
        <div className="animate-fade">
            <div className="page-header flex justify-between items-center">
                <div><h2>Super Admin</h2><p>Manage all registered tenants and businesses</p></div>
                <div className="flex gap-3">
                    <div className="stat-card" style={{ padding: '12px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>{tenants.length}</div>
                        <div className="text-xs text-muted">Total Tenants</div>
                    </div>
                    <div className="stat-card" style={{ padding: '12px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>{tenants.filter(t => t.isActive).length}</div>
                        <div className="text-xs text-muted">Active</div>
                    </div>
                </div>
            </div>

            {loading ? <div className="skeleton" style={{ height: 400, borderRadius: 16 }} /> : (
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>Business</th><th>Slug</th><th>Email</th><th>Plan</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                            {tenants.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-3)' }}>No tenants yet</td></tr> :
                                tenants.map(t => (
                                    <tr key={t._id}>
                                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>{t.name?.charAt(0)}</div>
                                            <div><div style={{ fontWeight: 600 }}>{t.name}</div><div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>{t.phone || 'No phone'}</div></div>
                                        </div></td>
                                        <td><code style={{ fontSize: '0.8rem', background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: 4 }}>{t.slug}</code></td>
                                        <td style={{ color: 'var(--color-text-2)' }}>{t.email}</td>
                                        <td><span className={`badge ${t.plan === 'pro' ? 'badge-primary' : t.plan === 'starter' ? 'badge-info' : 'badge-gray'}`}>{t.plan?.toUpperCase()}</span></td>
                                        <td style={{ color: 'var(--color-text-2)', fontSize: '0.85rem' }}>{format(new Date(t.createdAt), 'dd MMM yyyy')}</td>
                                        <td><span className={`badge ${t.isActive ? 'badge-success' : 'badge-danger'}`}>{t.isActive ? 'Active' : 'Inactive'}</span></td>
                                        <td>
                                            <button className={`btn btn-sm ${t.isActive ? 'btn-ghost' : 'btn-secondary'}`} style={{ color: t.isActive ? 'var(--color-danger)' : 'var(--color-success)' }} onClick={() => toggleActive(t._id, t.isActive)}>
                                                {t.isActive ? <><XCircle size={14} /> Deactivate</> : <><CheckCircle size={14} /> Activate</>}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
