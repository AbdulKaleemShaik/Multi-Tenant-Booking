import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Settings, Save, Copy, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
    const [tenant, setTenant] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/tenants/me').then(r => {
            setTenant(r.data.data); setForm(r.data.data);
        }).catch(() => {
            // fallback – try getting from auth user
        });
    }, []);

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            await api.put(`/tenants/${form._id}`, { name: form.name, phone: form.phone, description: form.description, address: form.address, primaryColor: form.primaryColor, settings: form.settings });
            toast.success('Settings saved!');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const bookingLink = `${window.location.origin}/book/${form.slug}`;

    if (!tenant) return <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />;

    return (
        <div className="animate-fade">
            <div className="page-header"><h2>Settings</h2><p>Manage your business profile and booking preferences</p></div>

            {/* Booking link banner */}
            <div className="card mb-6" style={{ background: 'var(--gradient-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Your Public Booking Link</div>
                        <div style={{ fontFamily: 'monospace', color: 'var(--color-primary-light)', fontSize: '0.9rem' }}>{bookingLink}</div>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(bookingLink); toast.success('Copied!'); }}><Copy size={14} /> Copy</button>
                        <a href={bookingLink} target="_blank" className="btn btn-primary btn-sm"><ExternalLink size={14} /> Open</a>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h3>Business Profile</h3>
                    <div className="form-group"><label className="form-label">Business Name</label><input className="form-input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Brand Color</label><input type="color" className="form-input" style={{ height: 42, cursor: 'pointer' }} value={form.primaryColor || '#6366f1'} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h3>Booking Preferences</h3>
                    <div className="form-group">
                        <label className="form-label">Lead time (minutes before booking can be made)</label>
                        <input className="form-input" type="number" min={0} value={form.settings?.bookingLeadTime ?? 60} onChange={(e) => setForm({ ...form, settings: { ...form.settings, bookingLeadTime: Number(e.target.value) } })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Booking window (days in advance)</label>
                        <input className="form-input" type="number" min={1} value={form.settings?.bookingWindow ?? 30} onChange={(e) => setForm({ ...form, settings: { ...form.settings, bookingWindow: Number(e.target.value) } })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Cancellation policy (hours before)</label>
                        <input className="form-input" type="number" min={0} value={form.settings?.cancellationPolicy ?? 24} onChange={(e) => setForm({ ...form, settings: { ...form.settings, cancellationPolicy: Number(e.target.value) } })} />
                    </div>
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <input type="checkbox" id="emailNotif" checked={form.settings?.emailNotifications ?? true} onChange={(e) => setForm({ ...form, settings: { ...form.settings, emailNotifications: e.target.checked } })} style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
                        <label htmlFor="emailNotif" style={{ fontSize: '0.9rem', color: 'var(--color-text)', cursor: 'pointer' }}>Send email notifications to customers</label>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: 'auto' }}><Save size={16} />{saving ? 'Saving...' : 'Save Settings'}</button>
                </div>
            </form>
        </div>
    );
}
