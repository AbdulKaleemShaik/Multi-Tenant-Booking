import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Briefcase, X } from 'lucide-react';

const EMPTY = { name: '', description: '', duration: 30, price: '', category: '', color: '#6366f1' };

export default function ServicesPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try { const { data } = await api.get('/services'); setServices(data.data); }
        catch (_) { } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const openModal = (service = null) => {
        setEditing(service);
        setForm(service ? { name: service.name, description: service.description || '', duration: service.duration, price: service.price, category: service.category || '', color: service.color || '#6366f1' } : EMPTY);
        setModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editing) { await api.put(`/services/${editing._id}`, form); toast.success('Service updated'); }
            else { await api.post('/services', form); toast.success('Service created'); }
            setModal(false); load();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to save service'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this service?')) return;
        try { await api.delete(`/services/${id}`); toast.success('Service deleted'); load(); }
        catch (_) { toast.error('Failed to delete'); }
    };

    return (
        <div className="animate-fade">
            <div className="page-header flex justify-between items-center">
                <div><h2>Services</h2><p>Manage the services your business offers</p></div>
                <button className="btn btn-primary" onClick={() => openModal()}><Plus size={18} /> Add Service</button>
            </div>

            {loading ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}</div> : (
                services.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <Briefcase size={48} style={{ color: 'var(--color-text-3)', marginBottom: 16 }} />
                        <h3>No services yet</h3><p>Add your first service to start accepting bookings.</p>
                        <button className="btn btn-primary mt-4" onClick={() => openModal()}><Plus size={18} /> Add Service</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {services.map((s) => (
                            <div key={s._id} className="card" style={{ borderTop: `3px solid ${s.color || 'var(--color-primary)'}` }}>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="badge badge-primary">{s.category || 'General'}</span>
                                    <div className="flex gap-2">
                                        <button className="btn btn-ghost btn-sm" onClick={() => openModal(s)}><Edit2 size={14} /></button>
                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(s._id)}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                <h3 style={{ marginBottom: 6 }}>{s.name}</h3>
                                <p style={{ fontSize: '0.85rem', marginBottom: 16 }}>{s.description || 'No description'}</p>
                                <div className="flex justify-between items-center">
                                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary-light)' }}>₹{s.price}</span>
                                    <span className="badge badge-gray">{s.duration} min</span>
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
                            <h3 className="modal-title">{editing ? 'Edit Service' : 'New Service'}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-group"><label className="form-label">Service Name *</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                            <div className="grid-2">
                                <div className="form-group"><label className="form-label">Duration (min) *</label><input className="form-input" type="number" min="5" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} required /></div>
                                <div className="form-group"><label className="form-label">Price (₹) *</label><input className="form-input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required /></div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group"><label className="form-label">Category</label><input className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Hair, Wellness" /></div>
                                <div className="form-group"><label className="form-label">Color</label><input className="form-input" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ height: 42, cursor: 'pointer' }} /></div>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Service' : 'Create Service'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
