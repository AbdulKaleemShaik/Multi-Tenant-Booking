import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, UserMinus, User, X, Mail, Phone } from 'lucide-react';

const EMPTY = { name: '', email: '', password: '', phone: '' };

export default function StaffPage() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try { const { data } = await api.get('/staff'); setStaff(data.data); }
        catch (_) { } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const openModal = (member = null) => {
        setEditing(member);
        setForm(member ? { name: member.name, email: member.email, phone: member.phone || '', password: '' } : EMPTY);
        setModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editing) { await api.put(`/staff/${editing._id}`, { name: form.name, phone: form.phone }); toast.success('Staff updated'); }
            else { await api.post('/staff', form); toast.success('Staff added successfully'); }
            setModal(false); load();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleRemove = async (id) => {
        if (!window.confirm('Remove this staff member?')) return;
        try { await api.delete(`/staff/${id}`); toast.success('Staff removed'); load(); }
        catch (_) { toast.error('Failed to remove staff'); }
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
                                </div>
                                <span className={`badge ${m.isActive ? 'badge-success' : 'badge-danger'}`} style={{ marginBottom: 16 }}>{m.isActive ? 'Active' : 'Inactive'}</span>
                                <div className="flex gap-2" style={{ justifyContent: 'center' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openModal(m)}><Edit2 size={14} /> Edit</button>
                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleRemove(m._id)}><UserMinus size={14} /> Remove</button>
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
                            <div className="flex gap-3">
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Staff'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
