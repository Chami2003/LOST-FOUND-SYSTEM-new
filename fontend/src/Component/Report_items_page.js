import React, { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import './Home.css';
import { API_PREFIX } from '../apiConfig';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

function ReportItemsPage({
  onTogglePage,
  isAuthenticated = false,
  currentUser,
  navSearch = '',
  onNavSearchChange,
  navCategory = '',
  onNavCategoryChange,
}) {
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [editingKey, setEditingKey] = useState('');
  const [deletingKey, setDeletingKey] = useState('');
  const [editValues, setEditValues] = useState({
    itemName: '',
    category: '',
    description: '',
    location: '',
    contact: '',
  });

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const isAdmin = currentUser?.role === 'admin';
      const lostUrl = isAdmin ? `${API_PREFIX}/lost-items/all` : `${API_PREFIX}/lost-items/my-reports/${currentUser._id}`;
      const foundUrl = isAdmin ? `${API_PREFIX}/found-items/all` : `${API_PREFIX}/found-items/my-reports/${currentUser._id}`;

      const [lostRes, foundRes] = await Promise.all([
        fetch(lostUrl),
        fetch(foundUrl),
      ]);
      const lost = await lostRes.json().catch(() => []);
      const found = await foundRes.json().catch(() => []);
      setLostItems(Array.isArray(lost) ? lost : []);
      setFoundItems(Array.isArray(found) ? found : []);
    } catch {
      setLostItems([]);
      setFoundItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    const lost = lostItems.map((x) => ({ ...x, reportType: 'lost', reportDate: x.dateLost }));
    const found = foundItems.map((x) => ({ ...x, reportType: 'found', reportDate: x.dateFound }));
    const merged = [...lost, ...found].sort((a, b) => new Date(b.reportDate || 0) - new Date(a.reportDate || 0));
    if (activeFilter === 'lost') return merged.filter((x) => x.reportType === 'lost');
    if (activeFilter === 'found') return merged.filter((x) => x.reportType === 'found');
    return merged;
  }, [lostItems, foundItems, activeFilter]);

  const firstImage = (item) => {
    if (Array.isArray(item.imageUrls) && item.imageUrls.length) return item.imageUrls[0];
    return item.imageUrl || '';
  };

  const startEdit = (item) => {
    setEditingKey(`${item.reportType}-${item._id}`);
    setEditValues({
      itemName: item.itemName || '',
      category: item.category || '',
      description: item.description || '',
      location: item.location || '',
      contact: String(item.contact || '').replace(/\D/g, '').slice(0, 10),
    });
  };

  const cancelEdit = () => {
    setEditingKey('');
    setEditValues({ itemName: '', category: '', description: '', location: '', contact: '' });
  };

  const saveEdit = async (item) => {
    const key = `${item.reportType}-${item._id}`;
    if (!editValues.itemName || !editValues.category || !editValues.description || !editValues.location || !editValues.contact) {
      alert('Please fill all fields before saving.');
      return;
    }
    if (editValues.contact.length !== 10) {
      alert('Please enter valid 10-digit contact number.');
      return;
    }
    const endpoint =
      item.reportType === 'lost'
        ? `${API_PREFIX}/lost-items/update/${item._id}`
        : `${API_PREFIX}/found-items/update/${item._id}`;
    const payload = {
      ...item,
      ...editValues,
      contact: editValues.contact,
      reportType: undefined,
      reportDate: undefined,
    };
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || 'Update failed.');
        return;
      }
      alert('Item updated successfully.');
      if (editingKey === key) cancelEdit();
      await load();
    } catch {
      alert('Cannot reach server.');
    }
  };

  const deleteItem = async (item) => {
    const key = `${item.reportType}-${item._id}`;
    if (!window.confirm(`Delete this ${item.reportType === 'lost' ? 'lost' : 'found'} report? This cannot be undone.`)) {
      return;
    }
    const endpoint =
      item.reportType === 'lost'
        ? `${API_PREFIX}/lost-items/delete/${item._id}`
        : `${API_PREFIX}/found-items/delete/${item._id}`;
    setDeletingKey(key);
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || 'Delete failed.');
        return;
      }
      if (editingKey === key) cancelEdit();
      await load();
    } catch {
      alert('Cannot reach server.');
    } finally {
      setDeletingKey('');
    }
  };

  return (
    <div className="home-container">
      <Navbar
        onTogglePage={onTogglePage}
        isAuthenticated={isAuthenticated}
        activePage="report"
        searchValue={navSearch}
        onSearchChange={onNavSearchChange}
        activeCategory={navCategory}
        onCategoryChange={onNavCategoryChange}
      />
      <main style={{ padding: '2rem 5%' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <h1 style={{ margin: 0, color: '#0f172a' }}>
            {currentUser?.role === 'admin' ? 'All Reported Items' : 'My Reported Items'}
          </h1>
          <p style={{ color: '#64748b' }}>
            Lost: {lostItems.length} · Found: {foundItems.length}
          </p>

          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
            <button type="button" className="hero-btn-secondary" onClick={() => setActiveFilter('all')}>
              All
            </button>
            <button type="button" className="hero-btn-secondary" onClick={() => setActiveFilter('lost')}>
              Lost
            </button>
            <button type="button" className="hero-btn-secondary" onClick={() => setActiveFilter('found')}>
              Found
            </button>
          </div>

          {loading ? (
            <p>Loading reported items...</p>
          ) : rows.length === 0 ? (
            <p>No reports yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.9rem' }}>
              {rows.map((item) => (
                <article key={`${item.reportType}-${item._id}`} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.95rem' }}>
                  {firstImage(item) ? (
                    <img
                      src={firstImage(item)}
                      alt={item.itemName || 'Reported item'}
                      style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: '0.6rem' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: item.reportType === 'lost' ? '#fef3c7' : '#dcfce7', color: item.reportType === 'lost' ? '#92400e' : '#166534' }}>
                    {item.reportType === 'lost' ? 'LOST' : 'FOUND'}
                  </span>
                  {editingKey === `${item.reportType}-${item._id}` ? (
                    <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.55rem' }}>
                      <input value={editValues.itemName} onChange={(e) => setEditValues((p) => ({ ...p, itemName: e.target.value }))} style={{ padding: '0.55rem 0.6rem', borderRadius: 7, border: '1px solid #dbe3ee' }} />
                      <input value={editValues.category} onChange={(e) => setEditValues((p) => ({ ...p, category: e.target.value }))} style={{ padding: '0.55rem 0.6rem', borderRadius: 7, border: '1px solid #dbe3ee' }} />
                      <textarea value={editValues.description} onChange={(e) => setEditValues((p) => ({ ...p, description: e.target.value }))} style={{ padding: '0.55rem 0.6rem', borderRadius: 7, border: '1px solid #dbe3ee', minHeight: 78 }} />
                      <input value={editValues.location} onChange={(e) => setEditValues((p) => ({ ...p, location: e.target.value }))} style={{ padding: '0.55rem 0.6rem', borderRadius: 7, border: '1px solid #dbe3ee' }} />
                      <input value={editValues.contact} onChange={(e) => setEditValues((p) => ({ ...p, contact: e.target.value.replace(/\D/g, '').slice(0, 10) }))} style={{ padding: '0.55rem 0.6rem', borderRadius: 7, border: '1px solid #dbe3ee' }} />
                    </div>
                  ) : (
                    <>
                      <h3 style={{ margin: '0.55rem 0 0.2rem' }}>{item.itemName || 'Untitled item'}</h3>
                      <p style={{ margin: 0, color: '#475569' }}>{item.category || 'Uncategorized'}</p>
                      <p style={{ margin: '0.5rem 0', color: '#334155' }}>{item.description || 'No description'}</p>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>📍 {item.location || '—'}</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem' }}>📞 {item.contact || '—'}</p>
                    </>
                  )}
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Date: {formatDate(item.reportDate)}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.65rem' }}>
                    {editingKey === `${item.reportType}-${item._id}` ? (
                      <>
                        <button type="button" className="hero-btn-primary" onClick={() => saveEdit(item)}>
                          Save
                        </button>
                        <button type="button" className="hero-btn-secondary" onClick={cancelEdit}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={deletingKey === `${item.reportType}-${item._id}`}
                          onClick={() => deleteItem(item)}
                          style={{
                            border: '1px solid #dc2626',
                            color: '#dc2626',
                            background: '#fff',
                            borderRadius: 8,
                            padding: '0.5rem 0.95rem',
                            cursor: deletingKey === `${item.reportType}-${item._id}` ? 'not-allowed' : 'pointer',
                            opacity: deletingKey === `${item.reportType}-${item._id}` ? 0.6 : 1,
                            fontWeight: 600,
                          }}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="hero-btn-secondary" onClick={() => startEdit(item)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deletingKey === `${item.reportType}-${item._id}`}
                          onClick={() => deleteItem(item)}
                          style={{
                            border: '1px solid #dc2626',
                            color: '#dc2626',
                            background: '#fff',
                            borderRadius: 8,
                            padding: '0.5rem 0.95rem',
                            cursor: deletingKey === `${item.reportType}-${item._id}` ? 'not-allowed' : 'pointer',
                            opacity: deletingKey === `${item.reportType}-${item._id}` ? 0.6 : 1,
                            fontWeight: 600,
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ReportItemsPage;
