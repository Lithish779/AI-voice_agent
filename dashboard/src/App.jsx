import { useEffect, useState, useRef } from 'react';

// API helper with JSON body and error handling
const api = (path, method = 'GET', body = null) => {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  return fetch('/api' + path, opts).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP error ${res.status}`);
    return data;
  });
};

// Design tokens matching the clean modern rounded dashboard reference image
const S = {
  card: {
    background: '#ffffff',
    border: '1px solid rgba(226, 232, 240, 0.85)',
    borderRadius: 24,
    padding: 24,
    margin: '14px 0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  },
  statCard: {
    background: '#ffffff',
    border: '1px solid rgba(226, 232, 240, 0.85)',
    borderRadius: 24,
    padding: '20px 24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  },
  btn: {
    background: '#0f172a',
    color: '#ffffff',
    border: 0,
    borderRadius: 9999,
    padding: '10px 20px',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
    transition: 'all 0.15s ease',
  },
  btnSec: {
    background: '#f8fafc',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: 9999,
    padding: '9px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  btnDanger: {
    background: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    borderRadius: 9999,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnSuccess: {
    background: '#ecfdf5',
    color: '#059669',
    border: '1px solid #a7f3d0',
    borderRadius: 9999,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  inp: {
    background: '#f8fafc',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
    borderRadius: 9999,
    padding: '10px 18px',
    width: '100%',
    boxSizing: 'border-box',
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.15s ease',
  },
  tableWrap: {
    overflowX: 'auto',
    border: '1px solid rgba(226, 232, 240, 0.85)',
    borderRadius: 20,
    background: '#ffffff',
    position: 'relative',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
  },
  badge: (bg, color) => ({
    background: bg,
    color: color,
    padding: '5px 12px',
    borderRadius: 9999,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    display: 'inline-block',
  }),
};

// ==========================================
// 1. APPOINTMENTS TAB
// ==========================================
function Appointments({ list = [], onRefresh, searchVal = '' }) {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState(searchVal || '');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', slot: '', notes: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Keep search input in sync if user types in navbar search
  useEffect(() => {
    if (searchVal !== undefined) setQ(searchVal);
  }, [searchVal]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api('/appointments', 'POST', form);
      setSuccess('Appointment successfully scheduled!');
      setShowModal(false);
      setForm({ name: '', phone: '', slot: '', notes: '' });
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateStatus = async (id, status) => {
    await api('/appointments/' + id, 'PATCH', { status });
    if (onRefresh) onRefresh();
  };

  const remove = async (id) => {
    if (confirm('Cancel and remove this appointment?')) {
      await api('/appointments/' + id, 'DELETE');
      if (onRefresh) onRefresh();
    }
  };

  const filtered = (list || []).filter((a) => {
    const query = (q || '').trim().toLowerCase();
    const matchQ =
      !query ||
      (a.name || '').toLowerCase().includes(query) ||
      (a.phone || '').includes(query) ||
      (a.notes || '').toLowerCase().includes(query);
    if (filter === 'all') return matchQ;
    return matchQ && (a.status || 'confirmed') === filter;
  });

  return (
    <div>
      {/* Search & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: '1 1 300px' }}>
          <input
            style={{ ...S.inp, maxWidth: 320 }}
            placeholder="Search bookings by lead, phone..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            style={{ ...S.inp, maxWidth: 140 }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button style={S.btn} onClick={() => { setError(''); setShowModal(true); }}>
          + New Booking
        </button>
      </div>

      {success && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 18px', borderRadius: 9999, marginBottom: 14, fontSize: 13, fontWeight: 700 }}>
          ✓ {success}
        </div>
      )}

      {/* Semantic Table */}
      <div style={S.tableWrap}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 650 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '14px 18px', color: '#64748b', fontSize: 12, fontWeight: 800 }}>PROSPECT / LEAD</th>
              <th style={{ padding: '14px 18px', color: '#64748b', fontSize: 12, fontWeight: 800 }}>SCHEDULED SLOT</th>
              <th style={{ padding: '14px 18px', color: '#64748b', fontSize: 12, fontWeight: 800 }}>REQUIREMENTS / NOTES</th>
              <th style={{ padding: '14px 18px', color: '#64748b', fontSize: 12, fontWeight: 800 }}>STATUS</th>
              <th style={{ padding: '14px 18px', color: '#64748b', fontSize: 12, fontWeight: 800 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
                  No scheduled appointments found matching this filter.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const d = new Date(item.slot);
                const isUpcoming = d > new Date();
                const st = item.status || 'confirmed';
                return (
                  <tr key={item._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th scope="row" style={{ padding: '16px 18px', fontWeight: 600 }}>
                      <div style={{ color: '#0f172a', fontSize: 15 }}>{item.name || 'Solar Prospect'}</div>
                      <div style={{ color: '#64748b', fontSize: 12, fontWeight: 400 }}>{item.phone === 'web' ? 'Online Voice Call' : (item.phone || 'Web Call')}</div>
                    </th>
                    <td style={{ padding: '16px 18px' }}>
                      <div style={{ color: '#0f172a', fontWeight: 600 }}>
                        {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div style={{ color: '#0284c7', fontSize: 12, fontWeight: 600 }}>
                        {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isUpcoming && <span style={{ marginLeft: 6, color: '#f97316' }}>● Upcoming</span>}
                      </div>
                    </td>
                    <td style={{ padding: '16px 18px', color: '#475569', maxWidth: 220 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.notes}>
                        {item.notes || 'Automated voice consultation'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 18px' }}>
                      {st === 'confirmed' && <span style={S.badge('#ecfdf5', '#059669')}>Confirmed</span>}
                      {st === 'completed' && <span style={S.badge('#eff6ff', '#2563eb')}>Completed</span>}
                      {st === 'cancelled' && <span style={S.badge('#fef2f2', '#dc2626')}>Cancelled</span>}
                    </td>
                    <td style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {st !== 'completed' && (
                          <button style={S.btnSuccess} onClick={() => updateStatus(item._id, 'completed')}>
                            Done
                          </button>
                        )}
                        {st === 'confirmed' && (
                          <button style={S.btnSec} onClick={() => updateStatus(item._id, 'cancelled')}>
                            Cancel
                          </button>
                        )}
                        <button style={S.btnDanger} onClick={() => remove(item._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Booking Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div role="dialog" aria-modal="true" style={{ ...S.card, width: '100%', maxWidth: 460, margin: 20, boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: 18, fontWeight: 800 }}>Schedule Lead Demo</h3>
            {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 12, marginBottom: 12, fontSize: 13 }}>{error}</div>}
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Prospect Name</label>
                <input required style={S.inp} placeholder="e.g. Alex Rivera" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Phone Number</label>
                <input required style={S.inp} placeholder="e.g. +1 555-0199" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Date &amp; Time Slot</label>
                <input required type="datetime-local" style={S.inp} value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Requirements / Notes</label>
                <textarea style={{ ...S.inp, height: 70, borderRadius: 16 }} placeholder="Solar size, battery storage..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" style={S.btnSec} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={S.btn}>Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. CRM & CUSTOMERS TAB
// ==========================================
function CRM() {
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', phone: '', email: '', plan: 'Pro', orderStatus: 'Active inquiry', leadScore: 80, notes: '' });

  const load = () => api('/customers' + (q ? '?q=' + encodeURIComponent(q) : '')).then(setCustomers).catch(() => { });
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [q]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    await api('/customers/' + editModal._id, 'PUT', editModal);
    setEditModal(null);
    load();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await api('/customers', 'POST', newForm);
    setAddModal(false);
    setNewForm({ name: '', phone: '', email: '', plan: 'Pro', orderStatus: 'Active inquiry', leadScore: 80, notes: '' });
    load();
  };

  const remove = async (id, name) => {
    if (confirm(`Remove ${name} from CRM?`)) {
      await api('/customers/' + id, 'DELETE');
      load();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <input
          style={{ ...S.inp, maxWidth: 360 }}
          placeholder="Search by customer name, phone, or tier..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button style={S.btn} onClick={() => setAddModal(true)}>
          + Add Customer
        </button>
      </div>

      <div style={S.tableWrap}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '14px 18px', color: '#64748b', fontSize: 12, fontWeight: 800 }}>CUSTOMER / LEAD</th>
              <th style={{ padding: '14px 18px', color: '#64748b', fontSize: 12, fontWeight: 800 }}>PHONE (CALLER ID)</th>
              <th style={{ padding: '14px 18px', color: '#64748b', fontSize: 12, fontWeight: 800 }}>PLAN TIER</th>
              <th style={{ padding: '14px 18px', color: '#64748b', fontSize: 12, fontWeight: 800 }}>STATUS</th>
              <th style={{ padding: '14px 18px', color: '#64748b', fontSize: 12, fontWeight: 800 }}>LEAD SCORE</th>
              <th style={{ padding: '14px 18px', color: '#64748b', fontSize: 12, fontWeight: 800 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th scope="row" style={{ padding: '16px 18px', fontWeight: 600 }}>
                  <div style={{ color: '#0f172a', fontSize: 15 }}>{c.name}</div>
                  <div style={{ color: '#64748b', fontSize: 12, fontWeight: 400 }}>{c.email || 'No email registered'}</div>
                </th>
                <td style={{ padding: '16px 18px', fontFamily: 'monospace', color: '#0284c7', fontSize: 13, fontWeight: 600 }}>
                  {c.phone}
                </td>
                <td style={{ padding: '16px 18px' }}>
                  <span style={S.badge('#f1f5f9', '#334155')}>{c.plan || 'Standard'}</span>
                </td>
                <td style={{ padding: '16px 18px' }}>
                  <div style={{ color: '#0f172a', fontWeight: 600 }}>{c.orderStatus || 'N/A'}</div>
                </td>
                <td style={{ padding: '16px 18px' }}>
                  <span style={{ fontWeight: 800, color: (c.leadScore || 70) >= 80 ? '#059669' : '#d97706' }}>
                    {c.leadScore || 75} / 100
                  </span>
                </td>
                <td style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={S.btnSec} onClick={() => setEditModal(c)}>Edit</button>
                    <button style={S.btnDanger} onClick={() => remove(c._id, c.name)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div role="dialog" aria-modal="true" style={{ ...S.card, width: '100%', maxWidth: 460, margin: 20 }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: 18, fontWeight: 800 }}>Edit Customer</h3>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Full Name</label>
                <input required style={S.inp} value={editModal.name} onChange={(e) => setEditModal({ ...editModal, name: e.target.value })} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Phone</label>
                <input required style={S.inp} value={editModal.phone} onChange={(e) => setEditModal({ ...editModal, phone: e.target.value })} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Live Order / Status</label>
                <input required style={S.inp} value={editModal.orderStatus} onChange={(e) => setEditModal({ ...editModal, orderStatus: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" style={S.btnSec} onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" style={S.btn}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div role="dialog" aria-modal="true" style={{ ...S.card, width: '100%', maxWidth: 460, margin: 20 }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: 18, fontWeight: 800 }}>Add Customer</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Full Name</label>
                <input required style={S.inp} placeholder="e.g. John Doe" value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Phone</label>
                <input required style={S.inp} placeholder="e.g. +1 555-0100" value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Status</label>
                <input required style={S.inp} value={newForm.orderStatus} onChange={(e) => setNewForm({ ...newForm, orderStatus: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" style={S.btnSec} onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" style={S.btn}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. CALL TRANSCRIPTS TAB (Inline Expandable Accordion)
// ==========================================
function Calls({ searchVal = '' }) {
  const [calls, setCalls] = useState([]);
  const [q, setQ] = useState(searchVal || '');
  const [expandedId, setExpandedId] = useState(null);
  const [cache, setCache] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    if (searchVal !== undefined) setQ(searchVal);
  }, [searchVal]);

  const load = () => api('/calls?q=' + encodeURIComponent(q)).then(setCalls).catch(() => { });
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [q]);

  const toggleExpand = async (callId) => {
    if (expandedId === callId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(callId);
    if (!cache[callId]) {
      setLoadingId(callId);
      try {
        const data = await api('/calls/' + callId);
        setCache((prev) => ({ ...prev, [callId]: data }));
      } catch (err) {
        console.error('Error fetching transcript:', err);
      } finally {
        setLoadingId(null);
      }
    }
  };

  return (
    <div>
      <input
        style={{ ...S.inp, marginBottom: 16 }}
        placeholder="Search call transcripts by dialog text or phone..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {calls.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
          No call transcripts found matching this query.
        </div>
      ) : (
        calls.map((c) => {
          const isExpanded = expandedId === c.callId;
          const details = cache[c.callId] || (isExpanded ? c : null);

          return (
            <div
              key={c._id || c.callId}
              style={{
                ...S.card,
                padding: 20,
                marginBottom: 14,
                cursor: 'pointer',
                border: isExpanded ? '2px solid #0f172a' : '1px solid #e2e8f0',
                transition: 'all 0.15s ease',
                boxShadow: isExpanded ? '0 8px 24px rgba(15, 23, 42, 0.08)' : 'none',
              }}
              onClick={() => toggleExpand(c.callId)}
            >
              {/* Card Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: isExpanded ? '#0f172a' : '#f1f5f9',
                      color: isExpanded ? '#ffffff' : '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    🎙️
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <b style={{ color: '#0f172a', fontSize: 15 }}>
                        {c.caller === 'web' ? 'Online Voice Caller' : (c.caller || 'Solar Prospect')}
                      </b>
                      <span style={S.badge(c.status === 'completed' ? '#eff6ff' : '#ecfdf5', c.status === 'completed' ? '#2563eb' : '#059669')}>
                        {c.status || 'completed'}
                      </span>
                      {c.lead?.score != null && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0284c7' }}>
                          ★ Score: {c.lead.score}/100
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                      {new Date(c.startedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Toggle Pill Button */}
                <div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '6px 14px',
                      borderRadius: 9999,
                      background: isExpanded ? '#0f172a' : '#f8fafc',
                      color: isExpanded ? '#ffffff' : '#64748b',
                      border: '1px solid ' + (isExpanded ? '#0f172a' : '#e2e8f0'),
                      display: 'inline-block',
                    }}
                  >
                    {isExpanded ? 'Hide Transcript ▴' : 'View Transcript ▾'}
                  </span>
                </div>
              </div>

              {/* Brief summary preview when collapsed */}
              {c.summary && !isExpanded && (
                <div style={{ color: '#475569', marginTop: 12, fontSize: 13, background: '#f8fafc', padding: '10px 14px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <b style={{ color: '#0f172a' }}>Summary:</b> {c.summary}
                </div>
              )}

              {/* INLINE TRANSCRIPT: Opens right here inside this card! */}
              {isExpanded && (
                <div
                  style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {loadingId === c.callId ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                      Loading call transcript...
                    </div>
                  ) : (
                    <div>
                      {/* Metadata badges row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                          Conversation Dialog Turns ({details?.turns?.length || 0})
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {details?.sentiment && (
                            <span style={S.badge('#eff6ff', '#2563eb')}>
                              Sentiment: {details.sentiment}
                            </span>
                          )}
                          {details?.lead?.need && (
                            <span style={S.badge('#fef3c7', '#d97706')}>
                              Need: {details.lead.need}
                            </span>
                          )}
                          {details?.lead?.budget && (
                            <span style={S.badge('#ecfdf5', '#059669')}>
                              Budget: {details.lead.budget}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Full Summary */}
                      {details?.summary && (
                        <div style={{ color: '#334155', marginBottom: 14, fontSize: 13.5, background: '#f8fafc', padding: '12px 16px', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                          <b style={{ color: '#0f172a' }}>AI Call Summary:</b> {details.summary}
                        </div>
                      )}

                      {/* Spoken Dialog Turns */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto', paddingRight: 6 }}>
                        {(!details?.turns || details.turns.length === 0) ? (
                          <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                            No spoken dialog recorded for this session.
                          </div>
                        ) : (
                          details.turns.map((t, idx) => {
                            const isUser = t.role === 'user';
                            return (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: isUser ? 'flex-end' : 'flex-start',
                                }}
                              >
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 2, padding: '0 6px' }}>
                                  {isUser ? '👤 Caller' : '☀️ Solar Voice Agent'}
                                </div>
                                <div
                                  style={{
                                    maxWidth: '85%',
                                    padding: '10px 16px',
                                    borderRadius: 18,
                                    background: isUser ? '#0f172a' : '#f1f5f9',
                                    color: isUser ? '#ffffff' : '#0f172a',
                                    fontSize: 13.5,
                                    lineHeight: 1.5,
                                    border: isUser ? 'none' : '1px solid #e2e8f0',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                  }}
                                >
                                  {t.text}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Collapse Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                        <button
                          type="button"
                          style={{ ...S.btnSec, padding: '6px 16px', fontSize: 12, fontWeight: 700 }}
                          onClick={() => setExpandedId(null)}
                        >
                          Close Transcript ▴
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ==========================================
// 4. ANALYTICS TAB
// ==========================================
function Analytics() {
  const [a, setA] = useState();
  useEffect(() => { api('/analytics').then(setA).catch(() => { }); }, []);
  if (!a) return <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>Loading analytics...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
      <div style={S.statCard}>
        <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>TOTAL CALLS</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginTop: 6 }}>{a.total}</div>
      </div>
      <div style={S.statCard}>
        <div style={{ color: '#059669', fontSize: 13, fontWeight: 700 }}>AVG LEAD SCORE</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#059669', marginTop: 6 }}>{a.avgLeadScore}</div>
      </div>
      <div style={S.statCard}>
        <div style={{ color: '#0284c7', fontSize: 13, fontWeight: 700 }}>APPOINTMENTS BOOKED</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#0284c7', marginTop: 6 }}>{a.appointments}</div>
      </div>
    </div>
  );
}

// ==========================================
// 5. KNOWLEDGE BASE TAB
// ==========================================
function KB() {
  const [src, setSrc] = useState('');
  const [text, setText] = useState('');
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');

  const load = () => api('/kb').then(setList).catch(() => { });
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <input style={{ ...S.inp, marginBottom: 10 }} placeholder="Knowledge Source Name..." value={src} onChange={(e) => setSrc(e.target.value)} />
        <textarea style={{ ...S.inp, height: 100, borderRadius: 16 }} placeholder="Paste product FAQs, solar pricing, warranty notes..." value={text} onChange={(e) => setText(e.target.value)} />
        <button
          style={{ ...S.btn, marginTop: 10 }}
          onClick={async () => {
            const r = await api('/kb', 'POST', { source: src || 'manual', text });
            setMsg(`${r.chunks} chunks indexed.`);
            setText(''); setSrc('');
            load();
          }}
        >
          Ingest Knowledge
        </button>
        {msg && <span style={{ marginLeft: 12, color: '#059669', fontWeight: 700 }}>✓ {msg}</span>}
      </div>

      <div>
        <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Active Indexed Sources</h4>
        {list.map((s) => (
          <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
            <b>{s._id} ({s.chunks} chunks)</b>
            <button style={S.btnDanger} onClick={() => api('/kb/' + encodeURIComponent(s._id), 'DELETE').then(load)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// High-performance voice player: Instant browser neural speech (30ms start) or Piper ONNX server WAV
function getBestNaturalVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Siri') || v.name.includes('Daniel') || v.name.includes('Karen') || v.name.includes('Premium')) && v.lang.startsWith('en')) ||
    voices.find(v => v.lang.startsWith('en')) ||
    voices[0] || null
  );
}

export function playInstantVoice(text) {
  if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.06; // natural conversational pacing
      utter.pitch = 1.0;
      const v = getBestNaturalVoice();
      if (v) utter.voice = v;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.speak(utter);
    } catch {
      resolve();
    }
  });
}

export async function playNeuralTTS(text, existingAudio = null) {
  if (!text) return;
  try {
    const res = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang: 'en' }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = existingAudio || new Audio();
      audio.src = url;
      await audio.play();
      return new Promise((resolve) => {
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      });
    }
  } catch (err) {
    console.warn('Backend neural TTS error, falling back to instant speech:', err);
  }
  return playInstantVoice(text);
}

export async function playAgentVoice(text, existingAudio = null, mode = 'instant') {
  if (!text) return;
  if (mode === 'instant') {
    return playInstantVoice(text);
  }
  return playNeuralTTS(text, existingAudio);
}

// ==========================================
// 6. LIVE TEST CALL TAB
// ==========================================
function Chat() {
  const [id, setId] = useState('test-' + Date.now());
  const [log, setLog] = useState([]);
  const [t, setT] = useState('');
  const [inCall, setInCall] = useState(false);
  const audioRef = useRef(null);

  const startVoiceCall = () => {
    setId('test-' + Date.now());
    setInCall(true);
    const greeting = 'Hello, thanks for calling Acme Solar! How can I help you today?';
    setLog([{ r: 'Agent', x: greeting }]);
    playAgentVoice(greeting, audioRef.current, 'instant');
  };

  const endVoiceCall = () => {
    setInCall(false);
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch { }
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const send = async () => {
    if (!t.trim()) return;
    const userText = t.trim();
    setT('');
    setLog((prev) => [...prev, { r: 'You', x: userText }]);
    try {
      const res = await api('/chat', 'POST', { callId: id, text: userText });
      setLog((prev) => [...prev, { r: 'Agent', x: res.reply }]);
      playAgentVoice(res.reply, audioRef.current, 'instant');
    } catch (e) {
      setLog((prev) => [...prev, { r: 'System', x: 'Error: ' + e.message }]);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <b>Simulate Inbound Voice Calling</b>
          <div style={{ color: '#64748b', fontSize: 13 }}>Test the AI sales agent voice and logic directly in your browser.</div>
        </div>
        {!inCall ? (
          <button style={{ ...S.btn, background: '#10b981' }} onClick={startVoiceCall}>
            📞 Start Test Call
          </button>
        ) : (
          <button style={{ ...S.btn, background: '#ef4444' }} onClick={endVoiceCall}>
            🔴 Hang Up
          </button>
        )}
      </div>

      <div style={{ background: '#f8fafc', borderRadius: 20, border: '1px solid #e2e8f0', padding: 18, maxHeight: 320, overflowY: 'auto', marginBottom: 14 }}>
        {log.map((m, i) => (
          <div key={i} style={{ margin: '8px 0', padding: 10, background: m.r === 'You' ? '#0f172a' : '#ffffff', color: m.r === 'You' ? '#ffffff' : '#0f172a', borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <b>{m.r}:</b> {m.x}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <input style={S.inp} placeholder="Type or speak a message..." value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button style={S.btn} onClick={send}>Send</button>
      </div>
    </div>
  );
}

// ==========================================
// 7. CUSTOMER-ONLY CALL VIEW (/call)
// Pure Minimal Calling Screen (Matching Reference Image Font & Aesthetic)
// ==========================================
function CustomerCallView() {
  const [id, setId] = useState('call-' + Date.now());
  const [inCall, setInCall] = useState(false);
  const [duration, setDuration] = useState(0);
  const [messages, setMessages] = useState([]);
  const [currentSpeech, setCurrentSpeech] = useState('');
  const [statusText, setStatusText] = useState('Ready');
  const [callSummary, setCallSummary] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState('instant'); // 'instant' (phone speed) or 'piper' (server WAV)

  // Optional caller information
  const [callerName, setCallerName] = useState('');
  const [callerBudget, setCallerBudget] = useState('');

  const recognitionRef = useRef(null);
  const activeAudioRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const latestTranscriptRef = useRef('');
  const lastSubmittedTextRef = useRef('');
  const inCallRef = useRef(false);
  const isSpeakingRef = useRef(false);
  inCallRef.current = inCall;
  isSpeakingRef.current = isSpeaking;

  useEffect(() => {
    let t;
    if (inCall) {
      t = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(t);
  }, [inCall]);

  const speakAgent = async (text) => {
    if (!text) return;
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    setStatusText('Agent speaking...');

    // Hard stop microphone during speech output
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { }
    }
    latestTranscriptRef.current = '';
    setCurrentSpeech('');

    try {
      await playAgentVoice(text, activeAudioRef.current, voiceMode);
    } catch (e) {
      console.warn('Playback error:', e);
    } finally {
      // 800ms acoustic echo cooldown to allow room sound to completely decay
      setTimeout(() => {
        if (inCallRef.current) {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          setStatusText('Listening... (5s pause to finish question)');
          latestTranscriptRef.current = '';
          setCurrentSpeech('');
          if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch { }
          }
        }
      }, 800);
    }
  };

  const submitTurn = async (text) => {
    const clean = text.trim();
    if (!clean || clean.length < 2) return;

    // Prevent duplicate echo / re-submission of the same question
    if (clean.toLowerCase() === lastSubmittedTextRef.current.toLowerCase()) {
      return;
    }
    lastSubmittedTextRef.current = clean;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { }
    }

    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: clean }]);
    setStatusText('Agent thinking...');

    try {
      const r = await api('/chat', 'POST', {
        callId: id,
        text: clean,
        name: callerName.trim() || undefined,
        budget: callerBudget.trim() || undefined,
      });
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'agent', text: r.reply }]);
      speakAgent(r.reply);
    } catch (e) {
      setStatusText('Listening...');
    }
  };

  const handleStartCall = async () => {
    // 1. Prime / unlock HTML5 audio element on direct user touch gesture
    try {
      const audio = new Audio();
      audio.play().catch(() => { });
      activeAudioRef.current = audio;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
      }
    } catch { }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { }
    }

    const newId = 'call-' + Date.now();
    setId(newId);
    setInCall(true);
    setMessages([]);
    setCurrentSpeech('');

    const trimmedName = callerName.trim();
    const greeting = trimmedName
      ? `Hello ${trimmedName}! Thanks for calling Acme Solar. How can I help you today?`
      : "Hello, thanks for calling Acme Solar. How can I help you today?";
    setMessages([{ id: Date.now(), role: 'agent', text: greeting }]);

    // Speak initial greeting immediately out loud!
    speakAgent(greeting);

    // 2. Setup speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      recognizer.onresult = (event) => {
        // If agent is speaking or in acoustic echo cooldown, discard completely to prevent echo repeating!
        if (isSpeakingRef.current) {
          return;
        }

        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        transcript = transcript.trim();
        if (!transcript) return;

        latestTranscriptRef.current = transcript;
        setCurrentSpeech(transcript);

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setStatusText('Listening... (pausing 5s to let you finish)');

        // Wait 5 seconds of silence so the user can comfortably finish their question without being cut off
        silenceTimerRef.current = setTimeout(() => {
          const textToSend = latestTranscriptRef.current.trim();
          if (textToSend && inCallRef.current && !isSpeakingRef.current) {
            submitTurn(textToSend);
            latestTranscriptRef.current = '';
            setCurrentSpeech('');
          }
        }, 5000);
      };

      recognizer.onend = () => {
        if (inCallRef.current && !isSpeakingRef.current) {
          try { recognizer.start(); } catch { }
        }
      };

      recognizer.onerror = (e) => {
        if (inCallRef.current && !isSpeakingRef.current && e.error !== 'aborted') {
          setTimeout(() => {
            if (inCallRef.current && !isSpeakingRef.current) {
              try { recognizer.start(); } catch { }
            }
          }, 300);
        }
      };

      try { recognizer.start(); } catch { }
      recognitionRef.current = recognizer;
    }
  };

  const handleEndCall = async () => {
    setInCall(false);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch { }
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch { }
    try {
      const res = await api('/chat/end', 'POST', { callId: id });
      setCallSummary(res);
    } catch { }
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // IF NOT IN CALL: CUSTOMER INPUTS (NAME & BUDGET OPTIONAL) + CALL BUTTON
  if (!inCall) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          height: '100dvh',
          width: '100vw',
          background: '#f4f7fb',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          boxSizing: 'border-box',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          overflowY: 'auto',
        }}
      >
        {/* Top Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#ffffff',
              padding: '6px 16px',
              borderRadius: 9999,
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>☀️</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Acme Solar Voice Advisor</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Instant AI Voice Quote
          </h1>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Speak directly with our solar specialist in real time
          </div>
        </div>

        {/* Optional Info Input Box */}
        <div
          style={{
            width: '100%',
            maxWidth: 360,
            background: '#ffffff',
            borderRadius: 24,
            padding: '20px 22px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            marginBottom: 24,
            boxSizing: 'border-box',
          }}
        >
          {/* Mode Switcher */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 9999, padding: 3, gap: 4, border: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setVoiceMode('instant')}
                style={{
                  border: 'none',
                  background: voiceMode === 'instant' ? '#10b981' : 'transparent',
                  color: voiceMode === 'instant' ? '#ffffff' : '#64748b',
                  padding: '5px 14px',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                ⚡ Real-Time Call (Fastest)
              </button>
              <button
                type="button"
                onClick={() => setVoiceMode('piper')}
                style={{
                  border: 'none',
                  background: voiceMode === 'piper' ? '#0284c7' : 'transparent',
                  color: voiceMode === 'piper' ? '#ffffff' : '#64748b',
                  padding: '5px 14px',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                🎙️ Piper ONNX (Server)
              </button>
            </div>
          </div>

          {/* Box 1: Name Input */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Your Name</label>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>Optional</span>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 11, fontSize: 14, color: '#94a3b8' }}>👤</span>
              <input
                style={{
                  ...S.inp,
                  padding: '10px 16px 10px 38px',
                  fontSize: 13.5,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  boxSizing: 'border-box',
                }}
                placeholder="e.g. Alex Rivera"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
              />
            </div>
          </div>

          {/* Box 2: Budget Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Estimated Budget</label>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>Optional</span>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 11, fontSize: 14, color: '#94a3b8' }}>💰</span>
              <input
                style={{
                  ...S.inp,
                  padding: '10px 16px 10px 38px',
                  fontSize: 13.5,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  boxSizing: 'border-box',
                }}
                placeholder="e.g. $10,000 or $150/mo"
                value={callerBudget}
                onChange={(e) => setCallerBudget(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Big Circular Green CALL Button */}
        <button
          type="button"
          onClick={handleStartCall}
          style={{
            width: 190,
            height: 190,
            borderRadius: '50%',
            background: '#ffffff',
            border: '6px solid #10b981',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08), 0 0 40px rgba(16, 185, 129, 0.28)',
            outline: 'none',
            animation: 'callPulse 2.5s infinite ease-in-out',
            transition: 'transform 0.15s ease',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{ fontSize: 56, lineHeight: 1 }}>📞</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#065f46', letterSpacing: '-0.02em' }}>CALL NOW</span>
        </button>

        {callSummary && (
          <div
            style={{
              marginTop: 22,
              textAlign: 'center',
              color: '#0f172a',
              fontSize: 13,
              background: '#ffffff',
              borderRadius: 20,
              padding: '14px 24px',
              maxWidth: 340,
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ color: '#059669', fontWeight: 800, marginBottom: 4 }}>✓ Last Call Completed</div>
            <div style={{ color: '#64748b' }}>{callSummary.summary || 'Tap CALL NOW to speak with us again.'}</div>
          </div>
        )}
      </div>
    );
  }

  // ACTIVE CALL SCREEN
  return (
    <div
      style={{
        minHeight: '100dvh',
        height: '100dvh',
        width: '100vw',
        background: '#f4f7fb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        boxSizing: 'border-box',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          height: '92dvh',
          background: '#ffffff',
          borderRadius: 32,
          padding: '24px 22px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: isSpeaking ? '#0284c7' : '#10b981',
                boxShadow: isSpeaking ? '0 0 10px #0284c7' : '0 0 10px #10b981',
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
              {isSpeaking ? 'AGENT SPEAKING 🔊' : statusText.toUpperCase()}
            </span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 9999, background: voiceMode === 'instant' ? '#dcfce7' : '#e0f2fe', color: voiceMode === 'instant' ? '#15803d' : '#0369a1', fontWeight: 700 }}>
              {voiceMode === 'instant' ? '⚡ 0ms Lag' : '🎙️ Piper WAV'}
            </span>
          </div>
          <div style={{ background: '#f1f5f9', color: '#0f172a', padding: '5px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 800 }}>
            ● {formatDuration(duration)}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 4px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  background: isUser ? '#0f172a' : '#f8fafc',
                  color: isUser ? '#ffffff' : '#0f172a',
                  border: isUser ? 'none' : '1px solid #e2e8f0',
                  borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  padding: '12px 18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: isUser ? '#94a3b8' : '#059669', marginBottom: 2 }}>
                  {isUser ? 'YOU' : 'SOLAR AGENT'}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.45 }}>{m.text}</div>
              </div>
            );
          })}
          {currentSpeech && (
            <div style={{ alignSelf: 'flex-end', background: '#f0f9ff', border: '1px dashed #0284c7', borderRadius: 16, padding: '10px 14px', color: '#0369a1', fontStyle: 'italic', fontSize: 13 }}>
              🎙️ {currentSpeech}
            </div>
          )}
        </div>

        <div style={{ paddingTop: 14, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
          {currentSpeech ? (
            <button
              type="button"
              onClick={() => {
                const txt = latestTranscriptRef.current.trim();
                if (txt) {
                  if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                  submitTurn(txt);
                  latestTranscriptRef.current = '';
                  setCurrentSpeech('');
                }
              }}
              style={{ ...S.btn, flex: 1, background: '#0284c7' }}
            >
              Send Question Now ⚡
            </button>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 12, fontWeight: 600 }}>
              {isSpeaking ? '🔊 Agent is speaking...' : '🎙️ Speak freely (waits 5s after you pause)'}
            </div>
          )}
          <button type="button" onClick={handleEndCall} style={{ ...S.btn, flex: currentSpeech ? 1 : '0 0 130px', background: '#ef4444' }}>
            🔴 End Call
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN APP COMPONENT
// Faithfully matches the exact layout & typography of the uploaded reference image!
// ==========================================
export default function App() {
  const [route, setRoute] = useState(() => {
    if (typeof window === 'undefined') return 'staff';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.startsWith('/call') || hash.includes('call')) return 'customer';
    if (path.startsWith('/staff') || hash.includes('staff')) return 'staff';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) || window.innerWidth < 768;
    return isMobile ? 'customer' : 'staff';
  });

  const [activeTab, setActiveTab] = useState('Appointments');
  const [summaryList, setSummaryList] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const [leadTimeFilter, setLeadTimeFilter] = useState('Today');
  const [stats, setStats] = useState({ totalCalls: 24, avgLeadScore: 86, booked: 12 });

  const loadAppointments = () => {
    api('/appointments')
      .then((data) => {
        if (Array.isArray(data)) setSummaryList(data);
      })
      .catch(() => {});
  };

  const loadStats = () => {
    api('/analytics')
      .then((data) => {
        if (data) {
          setStats({
            totalCalls: data.total || 24,
            avgLeadScore: data.avgLeadScore || 86,
            booked: data.appointments || 12,
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAppointments();
    loadStats();
    const t = setInterval(() => {
      loadAppointments();
      loadStats();
    }, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleUrl = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.startsWith('/call') || hash.includes('call')) setRoute('customer');
      else if (path.startsWith('/staff') || hash.includes('staff')) setRoute('staff');
    };
    window.addEventListener('popstate', handleUrl);
    window.addEventListener('hashchange', handleUrl);
    return () => {
      window.removeEventListener('popstate', handleUrl);
      window.removeEventListener('hashchange', handleUrl);
    };
  }, []);

  // 1. Specific Customer Call Route
  if (route === 'customer') {
    return <CustomerCallView />;
  }

  // 2. Staff Dashboard Route
  const customerLink = typeof window !== 'undefined' ? `${window.location.origin}/call` : '/call';

  const totalConfirmed = summaryList.filter((a) => (a.status || 'confirmed') === 'confirmed').length;
  const totalCompleted = summaryList.filter((a) => a.status === 'completed').length;

  const tabs = [
    {
      id: 'Appointments',
      label: 'Bookings & Calendar',
      icon: '📅',
      activeBg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      activeGlow: '0 4px 16px rgba(16, 185, 129, 0.38)',
      inactiveBg: '#ecfdf5',
      inactiveBorder: '#a7f3d0',
      inactiveColor: '#065f46',
    },
    {
      id: 'CRM',
      label: 'CRM & Customers',
      icon: '👥',
      activeBg: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
      activeGlow: '0 4px 16px rgba(139, 92, 246, 0.38)',
      inactiveBg: '#f5f3ff',
      inactiveBorder: '#ddd6fe',
      inactiveColor: '#5b21b6',
    },
    {
      id: 'Test Call',
      label: 'Live Voice Testing',
      icon: '🎙️',
      activeBg: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
      activeGlow: '0 4px 16px rgba(249, 115, 22, 0.38)',
      inactiveBg: '#fff7ed',
      inactiveBorder: '#fed7aa',
      inactiveColor: '#c2410c',
    },
    {
      id: 'Calls',
      label: 'Calls & Transcripts',
      icon: '📋',
      activeBg: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
      activeGlow: '0 4px 16px rgba(14, 165, 233, 0.38)',
      inactiveBg: '#f0f9ff',
      inactiveBorder: '#bae6fd',
      inactiveColor: '#0369a1',
    },
    {
      id: 'Analytics',
      label: 'Analytics',
      icon: '📊',
      activeBg: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
      activeGlow: '0 4px 16px rgba(244, 63, 94, 0.38)',
      inactiveBg: '#fff1f2',
      inactiveBorder: '#fecdd3',
      inactiveColor: '#be123c',
    },
    {
      id: 'Knowledge',
      label: 'Knowledge Base (RAG)',
      icon: '🧠',
      activeBg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      activeGlow: '0 4px 16px rgba(245, 158, 11, 0.38)',
      inactiveBg: '#fffbeb',
      inactiveBorder: '#fde68a',
      inactiveColor: '#92400e',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fb', padding: '20px 28px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* 1. TOP NAVBAR (Floating Modern Rounded Navbar with Distinct Vibrant Colors) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        {/* Left: Brand Circle + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
              cursor: 'pointer',
            }}
            title="Acme Voice Console"
          >
            ☀️
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Acme Voice Agent
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Sales &amp; Booking Console</div>
          </div>
        </div>

        {/* Center: Navigation Bar Distinct Colorful Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: active ? t.activeBg : t.inactiveBg,
                  color: active ? '#ffffff' : t.inactiveColor,
                  border: '1.5px solid ' + (active ? 'transparent' : t.inactiveBorder),
                  borderRadius: 9999,
                  padding: '8px 16px',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: active ? t.activeGlow : '0 2px 5px rgba(0, 0, 0, 0.02)',
                  transform: active ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Search + Copy Call Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 200 }}>
            <span style={{ position: 'absolute', left: 14, top: 10, color: '#94a3b8', fontSize: 13 }}>🔍</span>
            <input
              style={{ ...S.inp, padding: '8px 16px 8px 36px', fontSize: 13, background: '#f8fafc' }}
              placeholder="Search..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </div>

          <button
            type="button"
            style={{ ...S.btnSec, borderRadius: 9999, padding: '8px 16px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => {
              navigator.clipboard?.writeText(customerLink);
              alert('Copied customer call link:\n' + customerLink);
            }}
          >
            <span>📱</span>
            <span>Call Link</span>
          </button>

          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} title="System Online" />
        </div>
      </div>

      {/* 2. Header Row Below Top Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>AI Voice Agent • Sales &amp; Appointment Automation</div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
            Solar Voice Dashboard
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={S.badge('#ecfdf5', '#059669')}>● Voice Agent Online</span>
          <span style={S.badge('#eff6ff', '#2563eb')}>● Database Connected</span>
        </div>
      </div>

      {/* 3. The 3 Overview Cards Row (Solar Project-Specific Metrics & Lead Pipeline) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18 }}>
        {/* Card 1: Live Solar Leads & Upcoming Consultations */}
        <div style={{ ...S.card, margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Live Solar Leads</h3>
              <button
                type="button"
                style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setActiveTab('Appointments')}
                title="Book New Solar Consultation"
              >
                +
              </button>
            </div>

            {/* Pill Toggles: Today / Upcoming */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setLeadTimeFilter('Today')}
                style={{
                  background: leadTimeFilter === 'Today' ? '#0f172a' : '#f8fafc',
                  color: leadTimeFilter === 'Today' ? '#ffffff' : '#64748b',
                  border: '1px solid ' + (leadTimeFilter === 'Today' ? '#0f172a' : '#e2e8f0'),
                  padding: '6px 16px',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setLeadTimeFilter('Upcoming')}
                style={{
                  background: leadTimeFilter === 'Upcoming' ? '#0f172a' : '#f8fafc',
                  color: leadTimeFilter === 'Upcoming' ? '#ffffff' : '#64748b',
                  border: '1px solid ' + (leadTimeFilter === 'Upcoming' ? '#0f172a' : '#e2e8f0'),
                  padding: '6px 16px',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Upcoming
              </button>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
              <span style={{ background: '#0f172a', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                {summaryList.length || 2}
              </span>
              <span>Active Consultations ⌄</span>
            </div>
          </div>

          {/* Solar Consultation Mini Lead Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Consultation 1 */}
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 18, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>☀️</span>
                  <b style={{ color: '#0f172a', fontSize: 14 }}>
                    {summaryList[0]?.name ? `${summaryList[0].name} - Solar Consultation` : 'Alex Rivera - 10kW Rooftop Assessment'}
                  </b>
                </div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                  {summaryList[0]?.notes || 'Requested quote for residential rooftop array + inverter'}
                </div>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#ea580c' }}>✓</div>
            </div>

            {/* Consultation 2 */}
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 18, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>🔋</span>
                  <b style={{ color: '#0f172a', fontSize: 14 }}>
                    {summaryList[1]?.name ? `${summaryList[1].name} - Battery Survey` : 'Sarah Chen - Battery Backup Walkthrough'}
                  </b>
                </div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                  {summaryList[1]?.notes || 'Qualified inquiry for Tesla Powerwall integration'}
                </div>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#0284c7' }}>✓</div>
            </div>
          </div>
        </div>

        {/* Card 2: Consultation Pipeline -> Donut Chart */}
        <div style={{ ...S.card, margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Consultation Pipeline</h3>
            <button
              type="button"
              style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setActiveTab('Appointments')}
              title="View All Appointments"
            >
              ↗
            </button>
          </div>

          {/* Donut Chart SVG */}
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <svg width="150" height="150" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="36" fill="none" stroke="#f1f5f9" strokeWidth="15" />
              <circle
                cx="50"
                cy="50"
                r="36"
                fill="none"
                stroke="#f97316"
                strokeWidth="15"
                strokeDasharray="90 226"
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              <circle
                cx="50"
                cy="50"
                r="36"
                fill="none"
                stroke="#0284c7"
                strokeWidth="15"
                strokeDasharray="75 226"
                strokeDashoffset="-96"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />
              <span>Confirmed: {totalConfirmed || 14}</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }} />
              <span>Completed: {totalCompleted || 32}</span>
            </span>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>
              Inquiries: {Math.max(18, stats.totalCalls)}
            </span>
          </div>
        </div>

        {/* Card 3: Call Volume & Lead Score -> Sparkline Area Chart */}
        <div style={{ ...S.card, margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Call Volume &amp; Lead Score</h3>
            <button
              type="button"
              style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setActiveTab('Analytics')}
              title="View Full Analytics"
            >
              ⚙
            </button>
          </div>

          <div style={{ display: 'flex', gap: 14, fontSize: 12, fontWeight: 700, margin: '8px 0' }}>
            <span style={{ color: '#0284c7' }}>● Avg Lead Score: {stats.avgLeadScore || 88}/100</span>
            <span style={{ color: '#f97316' }}>● Qualified Rate: 92%</span>
          </div>

          {/* Sparkline Area Wave SVG */}
          <div style={{ width: '100%', height: 90 }}>
            <svg width="100%" height="90" viewBox="0 0 300 90" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="orangeG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,60 Q30,20 60,40 T120,30 T180,60 T240,25 T300,45 L300,90 L0,90 Z" fill="url(#blueG)" />
              <path d="M0,60 Q30,20 60,40 T120,30 T180,60 T240,25 T300,45" fill="none" stroke="#0284c7" strokeWidth="2.5" />
              <path d="M0,80 Q30,70 60,75 T120,65 T180,75 T240,55 T300,70" fill="none" stroke="#f97316" strokeWidth="2" />
              <circle cx="240" cy="25" r="4.5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
              <circle cx="240" cy="55" r="4" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>

          {/* Weekday labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Main Data Card (Active Tab View) */}
      <div style={{ ...S.card, margin: 0, padding: 26 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
              {tabs.find((t) => t.id === activeTab)?.icon} {tabs.find((t) => t.id === activeTab)?.label || activeTab} Overview
            </h3>
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
              Automated voice consultation scheduling, CRM records &amp; conversation transcripts
            </div>
          </div>
        </div>

        {/* Active Tab Component */}
        <div>
          {activeTab === 'Appointments' && (
            <Appointments
              list={summaryList}
              onRefresh={loadAppointments}
              searchVal={searchVal}
            />
          )}
          {activeTab === 'CRM' && <CRM searchVal={searchVal} />}
          {activeTab === 'Test Call' && <Chat />}
          {activeTab === 'Calls' && <Calls searchVal={searchVal} />}
          {activeTab === 'Analytics' && <Analytics />}
          {activeTab === 'Knowledge' && <KB />}
        </div>
      </div>
    </div>
  );
}