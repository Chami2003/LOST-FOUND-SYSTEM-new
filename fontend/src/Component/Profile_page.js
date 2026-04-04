import React from 'react';
import Navbar from './Navbar';
import './Home.css';

function readValue(value, fallback = 'Not available') {
  if (value === null || value === undefined) return fallback;
  const v = String(value).trim();
  return v ? v : fallback;
}

function ProfilePage({
  onTogglePage,
  isAuthenticated = false,
  currentUser,
  currentEmail = '',
  navSearch = '',
  onNavSearchChange,
  navCategory = '',
  onNavCategoryChange,
}) {
  const name = readValue(currentUser?.name, 'User');
  const email = readValue(currentUser?.email || currentEmail);
  const phone = readValue(currentUser?.phone);

  return (
    <div className="home-container">
      <Navbar
        onTogglePage={onTogglePage}
        isAuthenticated={isAuthenticated}
        activePage="profile"
        searchValue={navSearch}
        onSearchChange={onNavSearchChange}
        activeCategory={navCategory}
        onCategoryChange={onNavCategoryChange}
      />

      <main style={{ padding: '2rem 5%' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(2, 6, 23, 0.06)', padding: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a' }}>My Profile</h1>
          <p style={{ marginTop: '0.5rem', color: '#64748b' }}>Your account details</p>

          <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.85rem' }}>
            <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: 10 }}>
              <strong style={{ color: '#334155' }}>Name:</strong> {name}
            </div>
            <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: 10 }}>
              <strong style={{ color: '#334155' }}>Email:</strong> {email}
            </div>
            <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: 10 }}>
              <strong style={{ color: '#334155' }}>Phone:</strong> {phone}
            </div>
          </div>

          <div style={{ marginTop: '1.2rem' }}>
            <button type="button" className="hero-btn-secondary" onClick={() => onTogglePage?.('home')}>
              Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
