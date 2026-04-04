import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import './Home.css';
import { API_PREFIX } from '../apiConfig';

function MyClaimsPage({
  onTogglePage,
  isAuthenticated = false,
  currentUser,
  currentEmail = '',
  navSearch = '',
  onNavSearchChange,
  navCategory = '',
  onNavCategoryChange,
}) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = currentUser?._id;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchClaims = async () => {
      try {
        const res = await fetch(`${API_PREFIX}/found-items/my-claims/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch claims.');
        const data = await res.json();
        setClaims(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [userId]);

  return (
    <div className="home-container">
      <Navbar
        onTogglePage={onTogglePage}
        isAuthenticated={isAuthenticated}
        activePage="claims"
        searchValue={navSearch}
        onSearchChange={onNavSearchChange}
        activeCategory={navCategory}
        onCategoryChange={onNavCategoryChange}
      />

      <main style={{ padding: '2rem 5%' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a' }}>My Claims</h1>
          <p style={{ marginTop: '0.5rem', color: '#64748b' }}>
            A history of found items you have claimed.
          </p>

          {loading ? (
            <p style={{ marginTop: '2rem', textAlign: 'center' }}>Loading your claims...</p>
          ) : error ? (
            <p style={{ marginTop: '2rem', textAlign: 'center', color: '#ef4444' }}>{error}</p>
          ) : claims.length === 0 ? (
            <div style={{ marginTop: '2rem', textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <p style={{ color: '#64748b', fontSize: '1.1rem' }}>You haven't claimed any items yet.</p>
              <button type="button" className="hero-btn-primary" style={{ marginTop: '1rem' }} onClick={() => onTogglePage('matching')}>
                Browse Found Items
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {claims.map((item) => (
                <div key={item._id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                  <div style={{ height: 160, background: '#f1f5f9', position: 'relative' }}>
                    <img
                      src={item.imageUrl || item.imageUrls?.[0] || 'https://via.placeholder.com/400x200?text=No+Image'}
                      alt={item.itemName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: 12, right: 12, background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>
                      {item.status.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{item.itemName}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>{item.category}</p>
                    <p style={{ fontSize: '0.9rem', color: '#334155', marginTop: '0.75rem', lineBreak: 'anywhere' }}>{item.description}</p>
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#64748b' }}>
                      <div>📍 {item.location}</div>
                      <div style={{ marginTop: '0.25rem' }}>📅 Claimed on: {new Date(item.claimDate || item.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MyClaimsPage;
