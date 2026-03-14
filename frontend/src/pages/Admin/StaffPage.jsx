import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, UserMinus, User, X, Mail, Phone, AlertTriangle } from 'lucide-react';

const EMPTY = { name: '', email: '', password: '', phone: '', role: 'staff', reportsTo: '' };

export default function StaffPage() {
    const [staff, setStaff] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [managers, setManagers] = useState([]);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // Staff object to delete

    const load = async () => {
        try { 
            const [staffRes, rolesRes] = await Promise.all([
                api.get('/staff'),
                api.get('/roles/creatable')
            ]);
            setStaff(staffRes.data.data);
            setRoles(rolesRes.data.data);
            
            // Managers for the dropdown (Admin, Owner, Dashboard, Manager roles)
            const potentialManagers = staffRes.data.data.filter(s => 
                ['tenant_admin', 'super_admin', 'dashboard', 'manager'].includes(s.role?.name)
            );
            setManagers(potentialManagers);
        }
        catch (_) { } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const openModal = (member = null) => {
        setEditing(member);
        setForm(member ? { 
            name: member.name, 
            email: member.email, 
            phone: member.phone || '', 
            role: member.role?.name || 'staff',
            reportsTo: member.reportsTo?._id || '',
            password: '' 
        } : { ...EMPTY, role: roles[0]?.name || 'staff', reportsTo: '' });
        setModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editing) { 
                await api.put(`/staff/${editing._id}`, { 
                    name: form.name, 
                    phone: form.phone,
                    role: form.role,
                    reportsTo: form.reportsTo || null
                }); 
                toast.success('Staff updated'); 
            }
            else { await api.post('/staff', form); toast.success('Staff added successfully'); }
            setModal(false); load();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleRemove = (member) => {
        setDeleteConfirm(member);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        setSaving(true);
        try { 
            await api.delete(`/staff/${deleteConfirm._id}`); 
            toast.success('Staff member removed'); 
            setDeleteConfirm(null);
            load(); 
        }
        catch (_) { toast.error('Failed to remove staff'); }
        finally { setSaving(false); }
    };

    const avatarColor = (name) => {
        const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
        return colors[name?.charCodeAt(0) % colors.length] || '#6366f1';
    };

    return (
        <div className="animate-fade">
            <div className="page-header flex justify-between items-center">
                <div><h2>Staff</h2><p>Manage your team members and their access</p></div>
                <button className="btn btn-primary" onClick={() => openModal()}><Plus size={18} /> Add Staff</button>
            </div>

            {loading ? <div className="grid-3">{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}</div> : (
                staff.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <User size={48} style={{ color: 'var(--color-text-3)', marginBottom: 16 }} />
                        <h3>No staff members yet</h3><p>Add staff to assign bookings and manage schedules.</p>
                        <button className="btn btn-primary mt-4" onClick={() => openModal()}><Plus size={18} /> Add First Staff</button>
                    </div>
                ) : (
                    <div className="grid-3">
                        {staff.map((m) => (
                            <div key={m._id} className="card" style={{ textAlign: 'center' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: avatarColor(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                                    {m.name?.charAt(0).toUpperCase()}
                                </div>
                                <h3 style={{ marginBottom: 4 }}>{m.name}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: '0.85rem', color: 'var(--color-text-2)' }}><Mail size={13} /> {m.email}</div>
                                    {m.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: '0.85rem', color: 'var(--color-text-2)' }}><Phone size={13} /> {m.phone}</div>}
                                    {m.reportsTo && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', fontStyle: 'italic', marginTop: 4 }}>
                                            Reports to: {m.reportsTo.name}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                                    <span className={`badge ${m.isActive ? 'badge-success' : 'badge-danger'}`}>{m.isActive ? 'Active' : 'Inactive'}</span>
                                    <span className="badge" style={{ 
                                        background: m.role?.name === 'manager' ? '#8b5cf6' : 
                                                   m.role?.name === 'dashboard' ? '#ec4899' :
                                                   m.role?.name === 'tenant_admin' ? '#f59e0b' : '#6366f1', 
                                        color: 'white' 
                                    }}>
                                        {m.role?.displayName || 'Staff'}
                                    </span>
                                </div>
                                <div className="flex gap-2" style={{ justifyContent: 'center' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openModal(m)}><Edit2 size={14} /> Edit</button>
                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleRemove(m)}><UserMinus size={14} /> Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {modal && (
                <div className="modal-overlay" onClick={() => setModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editing ? 'Edit Staff Member' : 'Add Staff Member'}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                            <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editing} /></div>
                            {!editing && <div className="form-group"><label className="form-label">Password *</label><input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} /></div>}
                            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select 
                                    className="form-input" 
                                    value={form.role} 
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                >
                                    {roles.map(r => (
                                        <option key={r._id} value={r.name}>{r.displayName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reports To</label>
                                <select 
                                    className="form-input" 
                                    value={form.reportsTo} 
                                    onChange={(e) => setForm({ ...form, reportsTo: e.target.value })}
                                >
                                    <option value="">No Supervisor (Independent)</option>
                                    {managers
                                        .filter(m => m._id !== editing?._id) // Can't report to self
                                        .map(m => (
                                        <option key={m._id} value={m._id}>{m.name} ({m.role?.displayName})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Staff'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" style={{ maxWidth: 450, padding: 0, overflow: 'hidden', border: '1px solid rgba(239, 68, 68, 0.2)' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: '32px 32px 24px', textAlign: 'center' }}>
                            <div style={{ 
                                width: 80, height: 80, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', 
                                color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
                            }}>
                                <AlertTriangle size={40} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: 12, color: '#fff' }}>Remove Staff Member?</h2>
                            <p style={{ color: 'var(--color-text-2)', lineHeight: 1.6 }}>
                                You are about to remove <strong style={{ color: '#fff' }}>{deleteConfirm.name}</strong> from your team. This action cannot be undone and will affect their assigned bookings.
                            </p>
                        </div>
                        
                        <div style={{ 
                            padding: '24px 32px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex', gap: 12
                        }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button 
                                className="btn" 
                                style={{ 
                                    flex: 1.5, background: '#ef4444', color: '#fff', fontWeight: 600,
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                                }} 
                                disabled={saving}
                                onClick={confirmDelete}
                            >
                                {saving ? 'Removing...' : 'Permanently Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
