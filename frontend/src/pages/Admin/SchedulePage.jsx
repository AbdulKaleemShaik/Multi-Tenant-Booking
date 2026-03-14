import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Clock, X } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EMPTY_FORM = { staffId: '', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDuration: 30, breakStart: '', breakEnd: '' };

export default function SchedulePage() {
    const [schedules, setSchedules] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        const [sRes, stRes] = await Promise.all([api.get('/schedules'), api.get('/staff')]);
        setSchedules(sRes.data.data); setStaff(stRes.data.data);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault(); setSaving(true);
        try { await api.post('/schedules', form); toast.success('Schedule added'); setModal(false); load(); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this schedule?')) return;
        try { await api.delete(`/schedules/${id}`); toast.success('Schedule removed'); load(); }
        catch (_) { toast.error('Failed'); }
    };

    const getStaffName = (id) => staff.find(s => s._id === id)?.name || 'Unknown';

    return (
        <div className="animate-fade">
            <div className="page-header flex justify-between items-center">
                <div><h2>Schedules</h2><p>Configure staff working hours and break times</p></div>
                <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setModal(true); }}><Plus size={18} /> Add Schedule</button>
            </div>

            {loading ? <div className="skeleton" style={{ height: 300, borderRadius: 16 }} /> : (
                schedules.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <Clock size={48} style={{ color: 'var(--color-text-3)', marginBottom: 16 }} />
                        <h3>No schedules configured</h3>
                        <p>Add staff working hours to start generating booking slots.</p>
                        <button className="btn btn-primary mt-4" onClick={() => setModal(true)}><Plus size={18} /> Add Schedule</button>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th>Staff</th><th>Day</th><th>Working Hours</th><th>Slot Duration</th><th>Break Time</th><th></th></tr></thead>
                            <tbody>
                                {schedules.map((s) => (
                                    <tr key={s._id}>
                                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'white' }}>{getStaffName(s.staffId?._id || s.staffId)?.charAt(0)}</div>
                                            <span>{s.staffId?.name || getStaffName(s.staffId)}</span>
                                        </div></td>
                                        <td><span className="badge badge-primary">{DAYS[s.dayOfWeek]}</span></td>
                                        <td style={{ fontWeight: 500 }}>{s.startTime} – {s.endTime}</td>
                                        <td><span className="badge badge-gray">{s.slotDuration} min</span></td>
                                        <td style={{ color: 'var(--color-text-2)' }}>{s.breakStart ? `${s.breakStart} – ${s.breakEnd}` : '—'}</td>
                                        <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(s._id)}><Trash2 size={14} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {modal && (
                <div className="modal-overlay" onClick={() => setModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Schedule</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-group"><label className="form-label">Staff Member *</label>
                                <select className="form-select" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} required>
                                    <option value="">Select staff</option>
                                    {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="grid-2">
                                <div className="form-group"><label className="form-label">Day *</label>
                                    <select className="form-select" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}>
                                        {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label className="form-label">Slot Duration (min)</label><input className="form-input" type="number" min="5" value={form.slotDuration} onChange={(e) => setForm({ ...form, slotDuration: Number(e.target.value) })} /></div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group"><label className="form-label">Start Time *</label><input className="form-input" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></div>
                                <div className="form-group"><label className="form-label">End Time *</label><input className="form-input" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required /></div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group"><label className="form-label">Break Start</label><input className="form-input" type="time" value={form.breakStart} onChange={(e) => setForm({ ...form, breakStart: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Break End</label><input className="form-input" type="time" value={form.breakEnd} onChange={(e) => setForm({ ...form, breakEnd: e.target.value })} /></div>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>{saving ? 'Saving...' : 'Add Schedule'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
