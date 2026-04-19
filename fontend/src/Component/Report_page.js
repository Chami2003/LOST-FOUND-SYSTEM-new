import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import './Home.css';
import { API_PREFIX } from '../apiConfig';
import InteractiveMap from './InteractiveMap';

const CATEGORIES = ['Electronics', 'Documents', 'Clothes', 'Accessories', 'Others'];

const EMPTY_LOST = {
  itemName: '',
  description: '',
  category: '',
  location: '',
  dateLost: '',
  contact: '',
  imageUrls: [],
  mapCoordinates: null,
};

const EMPTY_FOUND = {
  itemName: '',
  description: '',
  category: '',
  location: '',
  dateFound: '',
  contact: '',
  imageUrls: [],
  mapCoordinates: null,
};

function ReportPage({
  onTogglePage,
  isAuthenticated = false,
  currentUser,
  navSearch = '',
  onNavSearchChange,
  navCategory = '',
  onNavCategoryChange,
}) {
  const [mode, setMode] = useState('lost');
  const [step, setStep] = useState('choose');
  const [lostForm, setLostForm] = useState(EMPTY_LOST);
  const [foundForm, setFoundForm] = useState(EMPTY_FOUND);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    try {
      const type = localStorage.getItem('pendingReportType');
      if (type && (type === 'lost' || type === 'found')) {
        setMode(type);
        setStep('form');
        localStorage.removeItem('pendingReportType');
      }

      const pending = localStorage.getItem('pendingPin');
      if (pending) {
        const coords = JSON.parse(pending);
        if (type === 'lost') {
            setLostForm(prev => ({ ...prev, mapCoordinates: coords }));
        } else if (type === 'found') {
            setFoundForm(prev => ({ ...prev, mapCoordinates: coords }));
        }
        localStorage.removeItem('pendingPin');
      }
    } catch(e) {
      console.error(e);
    }
  }, []);

  const updateForm = (key, value) => {
    if (mode === 'lost') {
      setLostForm((prev) => ({ ...prev, [key]: value }));
      return;
    }
    setFoundForm((prev) => ({ ...prev, [key]: value }));
  };

  const values = mode === 'lost' ? lostForm : foundForm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please login first');
      onTogglePage?.('login');
      return;
    }

    const endpoint = mode === 'lost' ? `${API_PREFIX}/lost-items/add` : `${API_PREFIX}/found-items/add`;
    const payload = {
      ...values,
      reportedBy: currentUser?._id || null,
      contact: String(values.contact || '').replace(/\D/g, '').slice(0, 10),
      imageUrls: Array.isArray(values.imageUrls) ? values.imageUrls : [],
      imageUrl: Array.isArray(values.imageUrls) && values.imageUrls.length ? values.imageUrls[0] : '',
      mapCoordinates: values.mapCoordinates || null,
    };

    if (!payload.itemName || !payload.description || !payload.category || !payload.location || !payload.contact) {
      alert('Please fill all required fields.');
      return;
    }
    if (payload.contact.length !== 10) {
      alert('Please enter a valid 10-digit contact number.');
      return;
    }
    if (mode === 'lost' && !payload.dateLost) {
      alert('Please select date lost.');
      return;
    }
    if (mode === 'found' && !payload.dateFound) {
      alert('Please select date found.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || 'Failed to submit report.');
        return;
      }
      alert(mode === 'lost' ? 'Lost item reported successfully!' : 'Found item reported successfully!');
      if (mode === 'lost') setLostForm(EMPTY_LOST);
      else setFoundForm(EMPTY_FOUND);
      onTogglePage?.('report-items');
    } catch {
      alert('Cannot reach server. Please ensure backend runs on port 5001.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoSelect = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5);
    if (!files.length) return;
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          })
      )
    ).then((images) => {
      const validImages = images.filter(Boolean);
      updateForm('imageUrls', validImages);
    });
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
        {step === 'choose' ? (
          <div
            style={{
              maxWidth: 980,
              margin: '0 auto',
              borderRadius: 16,
              overflow: 'hidden',
              background:
                'linear-gradient(135deg, rgba(11,43,79,0.92), rgba(15,105,161,0.78)), url(/image.png) center/cover',
              padding: '2rem',
              color: '#fff',
            }}
          >
            <h1 style={{ margin: 0, fontSize: '2rem', textAlign: 'center' }}>How can we help you today?</h1>
            <p style={{ marginTop: '0.6rem', textAlign: 'center', color: '#dbeafe' }}>
              Report your item quickly and help us reconnect owners with their belongings.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1.3rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(2px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '1.2rem' }}>
                <div style={{ width: 46, height: 46, borderRadius: 999, background: '#fb923c', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.7rem' }}>
                  ×
                </div>
                <h3 style={{ margin: 0 }}>I Lost Something</h3>
                <p style={{ marginTop: '0.45rem', color: '#e2e8f0' }}>
                  Submit a report for your lost item in our campus database.
                </p>
                <button type="button" className="hero-btn-primary" onClick={() => { setMode('lost'); setStep('form'); }}>
                  Report Lost
                </button>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(2px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '1.2rem' }}>
                <div style={{ width: 46, height: 46, borderRadius: 999, background: '#0ea5e9', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.7rem' }}>
                  ✓
                </div>
                <h3 style={{ margin: 0 }}>I Found Something</h3>
                <p style={{ marginTop: '0.45rem', color: '#e2e8f0' }}>
                  Help another student by reporting an item you have found.
                </p>
                <button type="button" className="hero-btn-primary" onClick={() => { setMode('found'); setStep('form'); }}>
                  Report Found
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 760, margin: '0 auto', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(2, 6, 23, 0.06)', padding: '1.5rem' }}>
            <h1 style={{ margin: 0, color: '#0f172a' }}>{mode === 'lost' ? 'Report Lost Item' : 'Report Found Item'}</h1>
            <p style={{ marginTop: '0.5rem', color: '#64748b' }}>Fill the details below to submit your report.</p>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', marginBottom: '1rem' }}>
              <button type="button" className="hero-btn-secondary" onClick={() => setStep('choose')}>
                Back
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.85rem' }}>
              <input
                type="text"
                placeholder="Item Name"
                value={values.itemName}
                onChange={(e) => updateForm('itemName', e.target.value)}
                style={{ padding: '0.8rem 0.9rem', borderRadius: 8, border: '1px solid #dbe3ee' }}
              />
              <select
                value={values.category}
                onChange={(e) => updateForm('category', e.target.value)}
                style={{ padding: '0.8rem 0.9rem', borderRadius: 8, border: '1px solid #dbe3ee' }}
              >
                <option value="">Select Category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Description"
                value={values.description}
                onChange={(e) => updateForm('description', e.target.value)}
                style={{ padding: '0.8rem 0.9rem', borderRadius: 8, border: '1px solid #dbe3ee', minHeight: 96, resize: 'vertical' }}
              />
              <input
                type="text"
                placeholder={mode === 'lost' ? 'Location Lost' : 'Location Found'}
                value={values.location}
                onChange={(e) => updateForm('location', e.target.value)}
                style={{ padding: '0.8rem 0.9rem', borderRadius: 8, border: '1px solid #dbe3ee' }}
              />
              <div style={{marginTop: "5px", marginBottom: "5px"}}>
                <label style={{ fontSize: '0.9rem', color: '#334155', display: 'block', marginBottom: '8px' }}>Tap map to pin exact location (Optional):</label>
                <InteractiveMap 
                   onMapClick={(coords) => updateForm('mapCoordinates', coords)} 
                   selectedPin={values.mapCoordinates} 
                />
              </div>
              <input
                type="date"
                max={today}
                value={mode === 'lost' ? values.dateLost : values.dateFound}
                onChange={(e) => updateForm(mode === 'lost' ? 'dateLost' : 'dateFound', e.target.value)}
                style={{ padding: '0.8rem 0.9rem', borderRadius: 8, border: '1px solid #dbe3ee' }}
              />
              <input
                type="tel"
                placeholder="Contact Number (10 digits)"
                value={values.contact}
                onChange={(e) => updateForm('contact', e.target.value.replace(/\D/g, '').slice(0, 10))}
                style={{ padding: '0.8rem 0.9rem', borderRadius: 8, border: '1px solid #dbe3ee' }}
              />
              <div style={{ border: '1px solid #dbe3ee', borderRadius: 8, padding: '0.8rem 0.9rem', background: '#fff' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#334155', marginBottom: '0.45rem' }}>
                  Add Photos (up to 5)
                </label>
                <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} />
                {Array.isArray(values.imageUrls) && values.imageUrls.length > 0 ? (
                  <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.55rem' }}>
                    {values.imageUrls.map((src, idx) => (
                      <img
                        key={`${idx}-${src.slice(0, 30)}`}
                        src={src}
                        alt={`upload-${idx + 1}`}
                        style={{ width: '100%', height: 84, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
              <button type="submit" className="hero-btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default ReportPage;
