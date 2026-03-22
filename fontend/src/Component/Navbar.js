import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Home.css';

const API_PREFIX = process.env.REACT_APP_API_BASE
  ? `${String(process.env.REACT_APP_API_BASE).replace(/\/$/, '')}/api`
  : 'http://localhost:5001/api';

function IconHome({ active }) {
  if (active) {
    return (
      <svg className="nav-pill-icon-svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    );
  }
  return (
    <svg className="nav-pill-icon-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconReport() {
  return (
    <svg className="nav-pill-icon-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCategories() {
  return (
    <svg className="nav-pill-icon-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHelp() {
  return (
    <svg className="nav-pill-icon-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSmartMatch({ active }) {
  if (active) {
    return (
      <svg className="nav-pill-icon-svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
        />
      </svg>
    );
  }
  return (
    <svg className="nav-pill-icon-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Navbar({ onTogglePage, activePage = 'home', searchValue = '', onSearchChange, activeCategory = '', onCategoryChange }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifyLoaded, setNotifyLoaded] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const notifyWrapRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_PREFIX}/notifications`);
      const text = await res.text();
      if (text.trimStart().startsWith('<')) {
        setNotifyLoaded(true);
        return;
      }
      const data = JSON.parse(text);
      if (data.notifications && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
      }
      setNotifyLoaded(true);
    } catch {
      setNotifyLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 25000);
    return () => clearInterval(id);
  }, [loadNotifications]);

  useEffect(() => {
    const onDoc = (e) => {
      if (notifyOpen && notifyWrapRef.current && !notifyWrapRef.current.contains(e.target)) {
        setNotifyOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [notifyOpen]);

  const markAllRead = async () => {
    try {
      await fetch(`${API_PREFIX}/notifications/mark-read`, { method: 'POST' });
      await loadNotifications();
    } catch {
      /* ignore */
    }
  };

  const showUnreadBadge = unreadCount > 0;
  const badgeNumber = showUnreadBadge ? unreadCount : notifications.length;
  const badgeDisplay = badgeNumber > 99 ? '99+' : String(badgeNumber);

  return (
    <nav className="home-navbar">
      <div className="home-brand">
        <img src="/image.png" alt="" className="home-logo-icon" />
        <span className="home-logo-text">iLost</span>
      </div>

      <ul className="home-nav-menu">
        <li className="nav-item">
          <div className="nav-pill-row nav-pill-row--extended" role="toolbar" aria-label="Navigation and quick actions">
            <div className="nav-pill-tabset" role="tablist" aria-label="Main sections">
              <button
                type="button"
                role="tab"
                aria-selected={activePage === 'home'}
                className={`nav-pill ${activePage === 'home' ? 'nav-pill--active' : ''}`}
                onClick={() => onTogglePage('home')}
              >
                <span className="nav-pill-label">Home</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePage === 'matching'}
                className={`nav-pill ${activePage === 'matching' ? 'nav-pill--active' : ''}`}
                onClick={() => onTogglePage('matching')}
              >
                <span className="nav-pill-label">Smart match</span>
              </button>

              <button type="button" className="nav-pill" onClick={() => alert('Report Item View')}>
                <span className="nav-pill-label">Report Item</span>
              </button>

              <div className="dropdown nav-pill-dropdown">
                <button type="button" className={`nav-pill ${activeCategory ? 'nav-pill--active' : ''}`}>
                  <span className="nav-pill-label">{activeCategory || 'Categories'}</span>
                </button>
                <div className="dropdown-content">
                  <span className={!activeCategory ? 'active' : ''} onClick={() => onCategoryChange?.('')}>
                    All Categories
                  </span>
                  <span className={activeCategory === 'Electronics' ? 'active' : ''} onClick={() => onCategoryChange?.('Electronics')}>
                    Electronics
                  </span>
                  <span className={activeCategory === 'Documents' ? 'active' : ''} onClick={() => onCategoryChange?.('Documents')}>
                    Documents
                  </span>
                  <span className={activeCategory === 'Clothes' ? 'active' : ''} onClick={() => onCategoryChange?.('Clothes')}>
                    Clothes
                  </span>
                  <span className={activeCategory === 'Accessories' ? 'active' : ''} onClick={() => onCategoryChange?.('Accessories')}>
                    Accessories
                  </span>
                  <span className={activeCategory === 'Others' ? 'active' : ''} onClick={() => onCategoryChange?.('Others')}>
                    Others
                  </span>
                </div>
              </div>
            </div>

            <button type="button" className="nav-pill nav-pill--help" onClick={() => alert('Help / Support')}>
              <span className="nav-pill-label">Help</span>
            </button>
          </div>
        </li>

        <li className="nav-item">
          <div className="nav-search-bar">
            <span className="search-icon" aria-hidden>
              🔍
            </span>
            <input
              type="search"
              placeholder="Search Item..."
              className="nav-search-input"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              aria-label="Filter items by keyword"
            />
          </div>
        </li>

        <li className="nav-item nav-notifications" ref={notifyWrapRef}>
          <button
            type="button"
            className="nav-link nav-link-icon-only nav-notify-btn"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            title={
              showUnreadBadge
                ? `${unreadCount} unread`
                : `${notifications.length} notification${notifications.length === 1 ? '' : 's'}`
            }
            onClick={() => setNotifyOpen((o) => !o)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fbbf24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" />
            </svg>
            {notifyLoaded ? (
              <span
                className={`nav-notify-badge ${showUnreadBadge ? 'nav-notify-badge--unread' : 'nav-notify-badge--total'}`}
              >
                {badgeDisplay}
              </span>
            ) : null}
          </button>
          {notifyOpen ? (
            <div className="nav-notify-panel" role="dialog" aria-label="Notifications list">
              <div className="nav-notify-header">
                <span className="nav-notify-title">Notifications</span>
                {unreadCount > 0 ? (
                  <button type="button" className="nav-notify-mark-read" onClick={markAllRead}>
                    Mark all read
                  </button>
                ) : null}
              </div>
              {notifications.length === 0 ? (
                <p className="nav-notify-empty">No notifications yet. New lost or found items will appear here.</p>
              ) : (
                <ul className="nav-notify-list">
                  {notifications.map((n) => (
                    <li
                      key={n._id}
                      className={`nav-notify-item ${n.read ? 'nav-notify-item--read' : ''}`}
                    >
                      <span className={`nav-notify-tag nav-notify-tag--${n.type}`}>{n.type === 'lost' ? 'Lost' : 'Found'}</span>
                      <p className="nav-notify-msg">{n.message}</p>
                      <time className="nav-notify-time">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </li>

        <li className="nav-item dropdown">
          <button type="button" className="nav-link nav-link-icon-only" aria-label="My account" title="My account">
            <span style={{ fontSize: '1.4rem' }}>👤</span>
          </button>
          <div className="dropdown-content dropdown-content--align-end">
            <span>My Reported Items</span>
            <span>My Claims</span>
            <span onClick={() => onTogglePage('update')}>Edit Profile</span>
            <span 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  alert('Account deletion requested. (Backend integration pending)');
                }
              }} 
              style={{ color: '#ef4444', fontWeight: '500' }}
            >
              Delete Account
            </span>
            <span onClick={() => onTogglePage('login')}>Logout</span>
          </div>
        </li>
      </ul>

      {activePage === 'home' ? (
        <div className="home-nav-actions">
          <button type="button" onClick={() => onTogglePage('login')} className="nav-login-btn">
            Log In
          </button>
        </div>
      ) : null}
    </nav>
  );
}

export default Navbar;
